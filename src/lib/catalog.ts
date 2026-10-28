import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type CategoryId = "aneis" | "aparadores" | "colares" | "pulseiras" | "brincos" | "tornozeleiras";
export type Material = "prata" | "ouro";
export type Variant = { sku: string; size: string; price: number; stock: number };
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  material: Material;
  description: string;
  photo: string | null;
  drawing: { kind: string; stone: string | null };
  variants: Variant[];
  priceFrom: number;
};
export type Catalog = { updatedAt: string; products: Product[] };

export const CATEGORIES: { id: CategoryId; label: string; one: string }[] = [
  { id: "aneis", label: "Anéis", one: "anel" },
  { id: "aparadores", label: "Aparadores", one: "aparador" },
  { id: "colares", label: "Colares", one: "colar" },
  { id: "pulseiras", label: "Pulseiras", one: "pulseira" },
  { id: "brincos", label: "Brincos", one: "brinco" },
  { id: "tornozeleiras", label: "Tornozeleiras", one: "tornozeleira" },
];
export const MATERIALS: { id: Material; label: string }[] = [
  { id: "prata", label: "Prata 925" },
  { id: "ouro", label: "Banhadas a ouro 18k" },
];

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const isRing = (p: Product) => p.category === "aneis" || p.category === "aparadores";
export const inStock = (p: Product) => p.variants.some((v) => v.stock > 0);

let cache: Promise<Catalog> | null = null;

/** Com Supabase: lê a tabela products (sincronizada pela Edge Function). Sem: lê o catalog.json gerado pela GitHub Action. */
export function loadCatalog(): Promise<Catalog> {
  if (cache) return cache;
  cache = (async () => {
    if (supabase) {
      const { data, error } = await supabase.from("catalog_public").select("*");
      if (!error && data) return { updatedAt: new Date().toISOString(), products: data as Product[] };
    }
    const res = await fetch(`${import.meta.env.BASE_URL}catalog.json`, { cache: "no-store" });
    return (await res.json()) as Catalog;
  })();
  return cache;
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    loadCatalog().then(setCatalog).catch(() => setError(true));
  }, []);
  return { catalog, error };
}
