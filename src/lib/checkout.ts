import { supabase } from "./supabase";
import { brl } from "./catalog";
import type { CartLine } from "./cart";
import { waLink } from "@/config";

// Pagamento fora do site: a Edge Function "create-checkout" confere preço e estoque no banco,
// cria a preferência no Mercado Pago (Checkout Pro) e devolve o link. A cliente paga lá
// (Pix, cartão ou boleto). Nenhum dado de cartão passa pelo site ou pelo nosso banco.

export async function startCheckout(lines: CartLine[], email?: string): Promise<{ url: string; via: "mercadopago" | "whatsapp" }> {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { items: lines.map((l) => ({ sku: l.sku, qty: l.qty })), email },
    });
    if (error || !data?.url) throw new Error("Não foi possível abrir o pagamento agora.");
    return { url: data.url as string, via: "mercadopago" };
  }
  // Modo prévia: o pedido segue pelo WhatsApp, já escrito.
  const text = [
    "Olá! Quero fechar este pedido na Morena Pratas:",
    "",
    ...lines.map((l) => `• ${l.qty}× ${l.name}${l.size !== "Único" ? ` (tam. ${l.size})` : ""} — ${brl(l.price * l.qty)} [${l.sku}]`),
    "",
    `Total: ${brl(lines.reduce((n, l) => n + l.price * l.qty, 0))}`,
  ].join("\n");
  return { url: waLink(text), via: "whatsapp" };
}
