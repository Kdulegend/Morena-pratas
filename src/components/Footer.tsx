import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/catalog";
import { STORE, waLink } from "@/config";

/** O fechamento: o nome volta em largura total sobre o palco, com o anel gigante cortado à direita. */
export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-stage">
      <svg aria-hidden="true" viewBox="0 0 400 400" className="pointer-events-none absolute -right-[10vw] -top-[14vh] h-[66vh] max-h-[640px] w-auto">
        <path d="M40 200 a160 168 0 1 0 320 0 a160 168 0 1 0 -320 0 Z M70 206 a130 138 0 1 0 260 0 a130 138 0 1 0 -260 0 Z" fill="var(--silver-3)" fillRule="evenodd" />
        <path d="M70 206 a130 138 0 0 1 260 0 a130 118 0 0 0 -260 0 Z" fill="var(--silver-4)" />
        <path d="M58 150 A156 164 0 0 1 180 40" fill="none" stroke="var(--silver-1)" strokeWidth="9" strokeLinecap="round" />
      </svg>

      <div className="wrap relative grid gap-10 pb-10 pt-10 md:grid-cols-12">
        <nav aria-label="Rodapé" className="md:col-span-4">
          <ul className="flex flex-col gap-2">
            {CATEGORIES.map((c) => (
              <li key={c.id}><Link to={`/loja/${c.id}`} className="nav-link">{c.label}</Link></li>
            ))}
            <li><Link to="/loja?material=ouro" className="nav-link">Banhadas a ouro</Link></li>
          </ul>
        </nav>
        <div className="flex flex-col gap-2 md:col-span-4 md:col-start-9">
          <a href={waLink("Olá, Morena Pratas!")} className="nav-link" target="_blank" rel="noreferrer">WhatsApp</a>
          <Link to="/entrar" className="nav-link">Minha conta</Link>
          <span className="text-muted">{STORE.city}</span>
        </div>
      </div>

      <div className="wrap relative pt-[18vh] md:pt-[30vh]">
        <p aria-hidden="true" className="whitespace-nowrap leading-[0.82] tracking-[-0.045em]" style={{ fontSize: "min(15.4vw, 15rem)" }}>
          morena pratas
        </p>
        <p className="t-small max-w-[70ch] pb-8 pt-6 text-muted">
          © {new Date().getFullYear()} Morena Pratas · Prata 925 e banho de ouro 18k · Pagamentos processados pelo Mercado Pago
        </p>
      </div>
    </footer>
  );
}
