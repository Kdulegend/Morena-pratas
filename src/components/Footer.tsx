import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/catalog";
import { STORE, waLink } from "@/config";

export function Footer() {
  return (
    <footer className="border-t border-[#e2e2e2]">
      <div className="wrap grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="t-lead">morena pratas</p>
          <p className="mt-2 text-muted">Prata 925 e banho de ouro 18k · {STORE.city}</p>
        </div>
        <nav aria-label="Categorias">
          <ul className="flex flex-col">
            {CATEGORIES.map((c) => (
              <li key={c.id}><Link to={`/loja/${c.id}`} className="nav-link">{c.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col">
          <a href={waLink("Olá, Morena Pratas!")} className="nav-link" target="_blank" rel="noreferrer">WhatsApp</a>
          <Link to="/entrar" className="nav-link">Minha conta</Link>
        </div>
      </div>
      <p className="wrap t-small pb-8 text-muted">
        © {new Date().getFullYear()} Morena Pratas · Pagamentos pelo Mercado Pago · Fotos ilustrativas: <a className="link" href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>
      </p>
    </footer>
  );
}
