// Configuração da loja. Valores marcados com TODO precisam ser confirmados antes de publicar.
export const STORE = {
  name: "Morena Pratas",
  city: "Salto, SP",
  // TODO: WhatsApp real da loja (DDI + DDD + número, só dígitos)
  whatsapp: (import.meta.env.VITE_WHATSAPP as string) || "5511900000000",
  instagram: "", // TODO: @ da loja
};

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
/** Sem Supabase o site roda em modo prévia: login com código de demonstração e pedido pelo WhatsApp. */
export const PREVIEW_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export function waLink(text: string) {
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
}
