import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = { sku: string; productId: string; slug: string; name: string; size: string; price: number; qty: number; max: number; photo?: string | null };

type CartCtx = {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "morena-sacola";

function read(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(read);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* sem armazenamento: a sacola vive só nesta aba */ }
  }, [lines]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((cur) => {
      const found = cur.find((l) => l.sku === line.sku);
      if (found) return cur.map((l) => (l.sku === line.sku ? { ...l, qty: Math.min(l.max, l.qty + qty) } : l));
      return [...cur, { ...line, qty: Math.min(line.max, qty) }];
    });
  }, []);
  const setQty = useCallback((sku: string, qty: number) => {
    setLines((cur) => cur.flatMap((l) => (l.sku !== sku ? [l] : qty <= 0 ? [] : [{ ...l, qty: Math.min(l.max, qty) }])));
  }, []);
  const remove = useCallback((sku: string) => setLines((cur) => cur.filter((l) => l.sku !== sku)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines, open, setOpen, add, setQty, remove, clear,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.qty * l.price, 0),
    }),
    [lines, open, add, setQty, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
}
