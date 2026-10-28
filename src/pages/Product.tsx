import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductArt } from "@/components/ProductArt";
import { CATEGORIES, brl, isRing, useCatalog } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useReveal } from "@/lib/useReveal";
import { waLink } from "@/config";

export default function ProductPage() {
  const { slug } = useParams();
  const { catalog } = useCatalog();
  const cart = useCart();
  const product = catalog?.products.find((p) => p.slug === slug);
  const [sku, setSku] = useState<string | null>(null);
  useReveal([product]);

  useEffect(() => {
    if (product) {
      setSku(product.variants.length === 1 ? product.variants[0].sku : null);
      document.title = `${product.name} · Morena Pratas`;
    }
  }, [product]);

  const variant = product?.variants.find((v) => v.sku === sku) ?? null;
  const cat = CATEGORIES.find((c) => c.id === product?.category);
  const related = useMemo(
    () => (catalog?.products ?? []).filter((p) => p.category === product?.category && p.id !== product?.id).slice(0, 4),
    [catalog, product],
  );

  if (catalog && !product) {
    return (
      <>
        <Header />
        <main className="wrap py-40">
          <h1 className="t-head">Essa peça saiu do estoque</h1>
          <p className="mt-6 max-w-[40ch] text-muted">Ela pode ter sido vendida agora há pouco.</p>
          <Link to="/loja" className="btn mt-8">Ver o que temos</Link>
        </main>
        <Footer />
      </>
    );
  }
  if (!product) return <><Header /><main className="wrap py-40 text-muted">Carregando…</main></>;

  const ring = isRing(product);
  const sized = product.variants.some((v) => v.size !== "Único");

  function add() {
    if (!variant || !product) return;
    cart.add({ sku: variant.sku, productId: product.id, slug: product.slug, name: product.name, size: variant.size, price: variant.price, max: variant.stock, photo: product.photo });
    cart.setOpen(true);
  }

  return (
    <>
      <Header />
      <main className="lg:grid lg:grid-cols-[47%_53%]">
        <div className="px-[var(--margin)] lg:sticky lg:top-0 lg:h-svh lg:py-[var(--margin)] lg:pr-0">
          <figure className="relative aspect-square overflow-hidden lg:aspect-auto lg:h-full">
            <ProductArt product={product} eager sizes="(min-width: 1024px) 47vw, 100vw" />
            {product.photoIllustrative && (
              <figcaption className="absolute bottom-3 left-3 bg-[rgba(36,21,15,0.88)] px-3 py-2 t-small text-ink">Foto ilustrativa. A peça vendida é a da descrição.</figcaption>
            )}
          </figure>
        </div>

        <div className="wrap pb-32 pt-10 lg:pl-[var(--pad)] lg:pr-[var(--margin)] lg:pt-[12svh]">
          <h1 className="text-[clamp(2rem,1.2rem+2.2vw,3rem)] leading-[1.04] tracking-[-0.02em] reveal">{product.name}</h1>
          <p className="mt-6 t-lead tabular reveal" style={{ ["--i" as string]: 1 }}>
            {variant ? brl(variant.price) : (sized && new Set(product.variants.map((v) => v.price)).size > 1 ? "a partir de " : "") + brl(product.priceFrom)}
          </p>
          <p className="mt-2 text-muted reveal" style={{ ["--i" as string]: 2 }}>
            {product.material === "ouro" ? <span className="text-gold">Prata 925 com banho de ouro 18k</span> : "Prata 925"}
          </p>

          {sized && (
            <fieldset className="mt-10 reveal" style={{ ["--i" as string]: 3 }}>
              <legend className="mb-3">{ring ? "Escolha o aro" : "Escolha o tamanho"}</legend>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.sku}
                    type="button"
                    aria-pressed={sku === v.sku}
                    onClick={() => setSku(v.sku)}
                    className={`btn !min-h-[52px] !min-w-[64px] tabular ${sku === v.sku ? "" : "btn-quiet"}`}
                  >
                    {v.size === "Único" ? "Único" : v.size}
                  </button>
                ))}
              </div>
              {ring && <a href={`${import.meta.env.BASE_URL}#aro`} className="link link-solo mt-2 t-small text-muted">Como descobrir meu aro</a>}
            </fieldset>
          )}

          <div className="mt-10 flex flex-col gap-2 sm:flex-row reveal" style={{ ["--i" as string]: 4 }}>
            <button type="button" className="btn !min-h-[60px] sm:flex-1" onClick={add} disabled={!variant}>
              {variant ? "Pôr na sacola" : ring ? "Escolha o aro primeiro" : "Escolha o tamanho primeiro"}
            </button>
            <a className="btn btn-quiet !min-h-[60px]" href={waLink(`Oi! Tenho uma dúvida sobre: ${product.name} (${product.id}).`)} target="_blank" rel="noreferrer">Perguntar</a>
          </div>
          {variant && variant.stock === 1 && <p className="mt-3 t-small text-muted">Última unidade neste tamanho.</p>}

          <dl className="reveal mt-16 grid max-w-[46ch] grid-cols-[auto_1fr] gap-x-8 gap-y-3">
            <dt className="text-muted">Material</dt><dd>{product.material === "ouro" ? "Prata 925 com banho de ouro 18k" : "Prata 925"}</dd>
            <dt className="text-muted">Tamanhos</dt><dd className="tabular">{product.variants.map((v) => v.size).join(", ")}</dd>
            <dt className="text-muted">Código</dt><dd className="tabular">{variant?.sku ?? product.id}</dd>
            <dt className="text-muted">Embalagem</dt><dd>Para presente, inclusa</dd>
          </dl>
          {product.description && <p className="mt-10 max-w-[46ch]">{product.description}</p>}
          <p className="reveal mt-10 max-w-[46ch] text-muted">
            Para manter o brilho, tire a peça no banho, na piscina e no mar, e passe perfume antes de colocá-la. Guarde num saquinho fechado.
          </p>

          {related.length > 0 && (
            <section aria-labelledby="mais-t" className="mt-24">
              <h2 id="mais-t" className="t-lead reveal">Mais {cat?.label.toLowerCase()}</h2>
              <Link to={`/loja/${product.category}`} className="link link-solo t-small text-muted">Ver todos os {cat?.label.toLowerCase()}</Link>
              <ul className="mt-6 grid grid-cols-2 gap-3">
                {related.map((p, i) => (
                  <li key={p.id} className="reveal" style={{ ["--i" as string]: i }}>
                    <Link to={`/peca/${p.slug}`} className="group block no-underline">
                      <div className="aspect-square overflow-hidden"><div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"><ProductArt product={p} /></div></div>
                      <p className="mt-3 leading-snug">{p.name}</p>
                      <p className="text-muted tabular">{brl(p.priceFrom)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
