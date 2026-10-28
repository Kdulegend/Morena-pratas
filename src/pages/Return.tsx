import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { useCart } from "@/lib/cart";
import { usePageTitle } from "@/lib/usePageTitle";

// Volta do Mercado Pago (back_urls). A confirmação real vem pelo webhook; aqui só informamos a cliente.
export default function Return() {
  const [params] = useSearchParams();
  const status = params.get("status") ?? params.get("collection_status");
  const { clear } = useCart();
  usePageTitle("Seu pedido");
  const ok = status === "approved";
  const pending = status === "pending" || status === "in_process";
  useEffect(() => { if (ok || pending) clear(); }, [ok, pending, clear]);

  return (
    <>
      <Header />
      <main className="wrap min-h-[70svh] pb-32 pt-[16svh]">
        <h1 className="t-head max-w-[16ch]">{ok ? "Pedido pago. Obrigada!" : pending ? "Pagamento em análise" : "O pagamento não foi concluído"}</h1>
        <p className="mt-6 max-w-[44ch] text-muted">
          {ok
            ? "Você vai receber a confirmação por e-mail. Já estamos separando a sua peça."
            : pending
              ? "Pix e boleto podem levar alguns minutos. Assim que confirmar, o pedido aparece na sua conta."
              : "Nada foi cobrado. Sua sacola continua salva para tentar de novo."}
        </p>
        <div className="mt-10 flex gap-3">
          <Link to="/conta" className="btn">Ver meus pedidos</Link>
          <Link to="/loja" className="btn btn-quiet">Voltar à loja</Link>
        </div>
      </main>
    </>
  );
}
