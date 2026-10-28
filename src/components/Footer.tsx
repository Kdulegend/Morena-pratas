import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/catalog";
import { STORE, waLink } from "@/config";

/** O fechamento: o nome volta em largura total sobre a última foto. */
export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-stage">
      <img
        src={`${import.meta.env.BASE_URL}img/secao-rodape.webp`}
        alt=""
        width={1600}
        height={900}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "brightness(0.42)" }}
      />

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
          © {new Date().getFullYear()} Morena Pratas · Prata 925 e banho de ouro 18k · Pagamentos processados pelo Mercado Pago · Fotos ilustrativas: <a className="link" href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>
        </p>
      </div>
    </footer>
  );
}
