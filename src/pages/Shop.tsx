import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductArt } from "@/components/ProductArt";
import { CATEGORIES, MATERIALS, brl, useCatalog, type CategoryId, type Material } from "@/lib/catalog";
import { useReveal } from "@/lib/useReveal";
import { usePageTitle } from "@/lib/usePageTitle";
import { waLink } from "@/config";

export default function Shop() {
  const { categoria } = useParams<{ categoria?: CategoryId }>();
  const [params, setParams] = useSearchParams();
  const material = (params.get("material") as Material | null) ?? null;
  const { catalog, error } = useCatalog();
  useReveal([catalog, categoria, material]);

  const cat = CATEGORIES.find((c) => c.id === categoria);
  const list = useMemo(
    () => (catalog?.products ?? []).filter((p) => (!cat || p.category === cat.id) && (!material || p.material === material)),
    [catalog, cat, material],
  );
  const title = cat ? cat.label : material === "ouro" ? "Banhadas a ouro" : "Loja";
  usePageTitle(title);
  const countFor = (id: CategoryId) => (catalog?.products ?? []).filter((p) => p.category === id && (!material || p.material === material)).length;

  const setMaterial = (m: Material | null) => {
    const next = new URLSearchParams(params);
    if (m) next.set("material", m); else next.delete("material");
    setParams(next, { replace: true });
  };

  return (
    <>
      <Header />
      <main className="wrap pb-40 pt-10 md:pt-16">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <h1 className="md:col-span-6" style={{ fontSize: "clamp(3.5rem, 8.4vw, 9rem)", lineHeight: 0.9, letterSpacing: "-0.035em" }}>{title}</h1>
          <p className="t-lead max-w-[30ch] md:col-span-6 md:col-start-7 md:justify-self-end">
            Joias em prata 925 e banho de ouro 18k. {list.length} {list.length === 1 ? "peça disponível" : "peças disponíveis"} agora. Se está aqui, está na gaveta.
          </p>
        </div>

        <nav aria-label="Categorias" className="mt-12 flex flex-wrap gap-2">
          <Link to={`/loja${material ? `?material=${material}` : ""}`} aria-current={!cat ? "page" : undefined} className={`btn shrink-0 !min-h-[44px] ${cat ? "btn-quiet" : ""}`}>Tudo</Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/loja/${c.id}${material ? `?material=${material}` : ""}`}
              aria-current={cat?.id === c.id ? "page" : undefined}
              className={`btn shrink-0 !min-h-[44px] ${cat?.id === c.id ? "" : "btn-quiet"}`}
            >
              {c.label} <span className="tabular opacity-70">{countFor(c.id)}</span>
            </Link>
          ))}
        </nav>
        <div role="group" aria-label="Material" className="mt-5 flex flex-wrap gap-6">
          {[{ id: null, label: "Prata e ouro" }, ...MATERIALS].map((m) => (
            <button
              key={m.label}
              type="button"
              aria-pressed={material === m.id}
              onClick={() => setMaterial(m.id as Material | null)}
              className={`min-h-[44px] transition-colors ${material === m.id ? "text-ink underline decoration-2 underline-offset-8" : "text-muted hover:text-ink"}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <p className="mt-6 t-small text-muted">Fotos ilustrativas, escolhidas pela semelhança com cada peça, até chegarem as fotos da nossa gaveta.</p>

        {error && <p className="mt-16">Não conseguimos carregar as peças agora. Atualize a página em instantes.</p>}
        {!catalog && !error && <p className="mt-16 text-muted">Carregando as peças…</p>}

        {catalog && list.length === 0 && (
          <div className="mt-16 max-w-[48ch]">
            <p className="t-lead">Nenhuma peça {material === "ouro" ? "banhada a ouro " : ""}aqui neste momento.</p>
            <p className="mt-4 text-muted">
              Chegam peças novas toda semana. <a className="link text-ink" href={waLink(`Oi! Quero saber quando chegam ${title.toLowerCase()}${material === "ouro" ? " banhadas a ouro" : ""}.`)} target="_blank" rel="noreferrer">Pede no WhatsApp</a> que a gente avisa.
            </p>
          </div>
        )}

        <ul className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {list.map((p, i) => {
            const sizes = p.variants.filter((v) => v.size !== "Único").map((v) => v.size);
            return (
              <li key={p.id} className="reveal" style={{ ["--i" as string]: i % 4 }}>
                <Link to={`/peca/${p.slug}`} className="group block no-underline">
                  <div className="aspect-square overflow-hidden">
                    <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                      <ProductArt product={p} />
                    </div>
                  </div>
                  <p className="mt-4 leading-snug">{p.name}</p>
                  <p className="mt-1 text-muted tabular">
                    {brl(p.priceFrom)}
                    {sizes.length > 0 && <span> · {p.category === "colares" ? "" : "aro "}{sizes.join(", ")}</span>}
                    {p.material === "ouro" && <span className="text-gold"> · banho de ouro</span>}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <Footer />
    </>
  );
}
