// Recebe o aviso do Mercado Pago, confirma o pagamento direto na API deles,
// atualiza o pedido, baixa o estoque no banco e lança a venda na aba Pedidos da planilha.
// Secrets: MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET (assinatura), GOOGLE_SERVICE_ACCOUNT_JSON, SHEET_ID
import { createClient } from "npm:@supabase/supabase-js@2";
import { appendRows, googleToken, readRange } from "../_shared/google.ts";

async function validSignature(req: Request, dataId: string) {
  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!secret) return true; // sem segredo configurado, a conferência na API abaixo continua valendo
  const sig = req.headers.get("x-signature") ?? "";
  const ts = sig.match(/ts=([^,]+)/)?.[1];
  const v1 = sig.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${req.headers.get("x-request-id") ?? ""};ts:${ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("") === v1;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const paymentId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (type !== "payment" || !paymentId) return new Response("ignorado");
  if (!(await validSignature(req, paymentId))) return new Response("assinatura inválida", { status: 401 });

  // a fonte da verdade é a API do Mercado Pago, não o corpo do aviso
  const pr = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}` },
  });
  if (!pr.ok) return new Response("pagamento não encontrado", { status: 404 });
  const pay = await pr.json();
  const orderId = pay.external_reference as string;

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).single();
  if (!order) return new Response("pedido não encontrado", { status: 404 });

  await db.from("orders").update({ status: pay.status, mp_payment_id: paymentId, updated_at: new Date().toISOString() }).eq("id", orderId);

  if (pay.status === "approved" && !order.stock_applied) {
    await db.rpc("apply_order_stock", { order_id: orderId });

    // Planilha: a coluna "Quantidade vendida" da aba Estoque já soma a aba Pedidos (ARRAYFORMULA por SKU),
    // então basta lançar o pedido lá. Colunas K–O ficam vazias para não quebrar as fórmulas da aba.
    try {
      const token = await googleToken("https://www.googleapis.com/auth/spreadsheets");
      const pedidos = await readRange("Pedidos!A2:A2000", token);
      const next = `S${String(pedidos.filter((r) => String(r[0] ?? "").startsWith("S")).length + 1).padStart(3, "0")}`;
      const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const forma =
        pay.payment_method_id === "pix" ? "Pix" :
        pay.payment_type_id === "credit_card" ? `Crédito ${pay.installments ?? 1}x` :
        pay.payment_type_id === "debit_card" ? "Débito" :
        pay.payment_type_id === "ticket" ? "Boleto" : "Mercado Pago";
      const cliente = [pay.payer?.first_name, pay.payer?.last_name].filter(Boolean).join(" ") || order.email || "";
      const vazio = ["", "", "", "", ""]; // K–O
      const rows = [
        [next, hoje, cliente, "", "", "", "", order.total, "Pago", forma, ...vazio, hoje, 1, ""],
        ...(order.items as { sku: string; qty: number; name: string; size: string; price: number }[]).map((it) => [
          next, hoje, cliente, it.sku, it.name, it.price, it.qty, it.price * it.qty, "Pago", forma, ...vazio, hoje, 0, "",
        ]),
      ];
      await appendRows("Pedidos!A1", rows, token);
    } catch (e) {
      console.error("planilha não atualizada", e); // o pedido segue válido; a próxima sincronização corrige o site
    }
  }
  return new Response("ok");
});
