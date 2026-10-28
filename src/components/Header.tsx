import { Link, NavLink } from "react-router-dom";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { to: "/loja/aneis", label: "Anéis" },
  { to: "/loja/aparadores", label: "Aparadores" },
  { to: "/loja/colares", label: "Colares" },
  { to: "/loja", label: "Loja toda", end: true },
];

export function CartButton({ className = "" }: { className?: string }) {
  const { count, setOpen } = useCart();
  return (
    <button type="button" onClick={() => setOpen(true)} className={`btn ${className}`} aria-label={`Abrir sacola, ${count} ${count === 1 ? "peça" : "peças"}`}>
      Sacola <span className="tabular">{count}</span>
    </button>
  );
}

/** Barra simples: marca, poucos links, uma ação. Na home a marca não aparece aqui (ela está gigante embaixo). */
export function Header({ home = false }: { home?: boolean }) {
  const { user } = useAuth();
  return (
    <header className={`wrap relative z-20 flex items-center gap-6 py-5 ${home ? "justify-end" : "justify-between"}`}>
      {!home && (
        <Link to="/" className="t-lead no-underline">
          morena pratas
        </Link>
      )}
      <nav aria-label="Principal" className="flex items-center gap-5 t-small sm:gap-7" >
        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              {l.label}
            </NavLink>
          ))}
        </div>
        <NavLink to="/loja" end className="nav-link md:hidden">
          Loja
        </NavLink>
        <NavLink to={user ? "/conta" : "/entrar"} className="nav-link">
          {user ? "Minha conta" : "Entrar"}
        </NavLink>
        <CartButton className="!min-h-[44px] !px-4" />
      </nav>
    </header>
  );
}
