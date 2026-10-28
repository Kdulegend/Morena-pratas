import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { brl, photoUrl } from "@/lib/catalog";
import { startCheckout } from "@/lib/checkout";
import { PREVIEW_MODE } from "@/config";

export function CartDrawer() {
  const { lines, total, open, setOpen, setQty, remove } = useCart();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, setOpen]);

  async function pay() {
    setBusy(true); setErr("");
    try {
      const { url } = await startCheckout(lines, user?.email);
      window.location.href = url;
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className={`fixed inset-0 z-50 transition-[visibility] duration-300 ${open ? "visible" : "invisible pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Sacola"
        tabIndex={-1}
        className={`drawer absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col bg-surface ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <h2 className="t-lead">Sua sacola</h2>
          <button type="button" className="nav-link t-small" onClick={() => setOpen(false)}>Fechar</button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col gap-6 px-6 pt-6">
            <p className="text-muted">Nenhuma peça por aqui ainda.</p>
            <Link to="/loja" className="btn self-start" onClick={() => setOpen(false)}>Ver a loja</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6">
              {lines.map((l) => (
                <li key={l.sku} className="mb-2 flex gap-4 bg-bg p-4">
                  {l.photo && <img src={photoUrl(l.photo)} alt="" width={72} height={72} className="h-[72px] w-[72px] shrink-0 bg-stage object-cover" />}
                  <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-4">
                    <Link to={`/peca/${l.slug}`} onClick={() => setOpen(false)} className="no-underline hover:opacity-75">
                      {l.name}
                    </Link>
                    <span className="tabular whitespace-nowrap">{brl(l.price * l.qty)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-y-2 t-small text-muted">
                    <span className="basis-full">{l.size === "Único" ? "Tamanho único" : `Tamanho ${l.size}`}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={`Tirar uma unidade de ${l.name}`} className="h-11 w-11 bg-surface" onClick={() => setQty(l.sku, l.qty - 1)}>−</button>
                      <span className="tabular w-8 text-center text-ink" aria-live="polite">{l.qty}</span>
                      <button type="button" aria-label={`Somar uma unidade de ${l.name}`} className="h-11 w-11 bg-surface disabled:opacity-40" disabled={l.qty >= l.max} onClick={() => setQty(l.sku, l.qty + 1)}>+</button>
                      <button type="button" className="nav-link ml-3" onClick={() => remove(l.sku)}>Remover</button>
                    </div>
                  </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="bg-bg px-6 pb-8 pt-5">
              <div className="mb-4 flex items-baseline justify-between">
                <span>Total</span>
                <span className="t-lead tabular">{brl(total)}</span>
              </div>
              <button type="button" className="btn w-full" onClick={pay} disabled={busy}>
                {busy ? "Abrindo o pagamento…" : PREVIEW_MODE ? "Fechar pedido pelo WhatsApp" : "Pagar com Pix, cartão ou boleto"}
              </button>
              {err && <p role="alert" className="mt-3 t-small">{err}</p>}
              <p className="mt-3 t-small text-muted">
                {PREVIEW_MODE
                  ? "Na prévia o pedido segue pelo WhatsApp. Com o Mercado Pago ligado, o pagamento abre na página segura deles."
                  : "O pagamento abre na página segura do Mercado Pago. Não guardamos dados de cartão."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
