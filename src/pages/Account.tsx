import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { brl } from "@/lib/catalog";
import { usePageTitle } from "@/lib/usePageTitle";

type Order = { id: string; created_at: string; status: string; total: number; items: { name: string; size: string; qty: number }[] };
const STATUS: Record<string, string> = { pending: "Aguardando pagamento", approved: "Pago", in_process: "Em análise", rejected: "Recusado", cancelled: "Cancelado", shipped: "Enviado", delivered: "Entregue" };

export default function Account() {
  const { user, ready, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  usePageTitle("Sua conta");

  useEffect(() => {
    if (!user) return;
    if (!supabase) { setOrders([]); return; }
    supabase.from("orders").select("id, created_at, status, total, items").order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as Order[]) ?? []));
  }, [user]);

  if (!ready) return null;
  if (!user) return <Navigate to="/entrar" state={{ from: "/conta" }} replace />;

  return (
    <>
      <Header />
      <main className="wrap grid gap-12 pb-40 pt-16 md:grid-cols-12 md:pt-24">
        <div className="md:col-span-4">
          <h1 className="t-head">Sua conta</h1>
          <p className="mt-6 break-all text-muted">{user.email}</p>
          <button type="button" className="btn btn-quiet mt-8" onClick={signOut}>Sair</button>
        </div>
        <section aria-labelledby="pedidos-t" className="md:col-span-7 md:col-start-6">
          <h2 id="pedidos-t" className="t-lead">Pedidos</h2>
          {orders === null && <p className="mt-6 text-muted">Carregando…</p>}
          {orders?.length === 0 && (
            <div className="mt-6">
              <p className="text-muted">Nenhum pedido ainda.</p>
              <Link to="/loja" className="btn mt-6">Ver a loja</Link>
            </div>
          )}
          <ul className="mt-6 flex flex-col gap-2">
            {orders?.map((o) => (
              <li key={o.id} className="bg-surface p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <span>{new Date(o.created_at).toLocaleDateString("pt-BR")}</span>
                  <span className="tabular">{brl(o.total)}</span>
                </div>
                <p className="mt-1 t-small text-muted">{STATUS[o.status] ?? o.status}</p>
                <ul className="mt-3 t-small">
                  {o.items.map((it, i) => <li key={i}>{it.qty}× {it.name}{it.size !== "Único" ? ` · ${it.size}` : ""}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
