import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductArt, SectionPhoto } from "@/components/ProductArt";
import { CATEGORIES, brl, useCatalog } from "@/lib/catalog";
import { waLink } from "@/config";

const INFO: [string, string][] = [
  ["Prata 925", "Em todas as peças de prata. As banhadas levam ouro 18k sobre prata 925."],
  ["Pagamento", "Pix, cartão ou boleto, na página segura do Mercado Pago."],
  ["Entrega", "Envio para todo o Brasil ou retirada em Salto, SP."],
  ["Troca", "Até 7 dias depois de receber, com a peça sem uso."],
];

export default function Home() {
  const { catalog } = useCatalog();
  const products = catalog?.products ?? [];
  const destaque = CATEGORIES.map((c) => products.find((p) => p.category === c.id)).filter(Boolean).slice(0, 4) as typeof products;
  const cover = (id: string) => products.find((p) => p.category === id);

  return (
    <>
      <Header />
      <main>
        {/* Abertura */}
        <section className="wrap grid items-center gap-10 pb-20 pt-6 md:grid-cols-2 md:gap-16 md:pb-28">
          <div className="order-2 md:order-1">
            <h1 className="t-head max-w-[14ch]">Joias em prata 925 e banho de ouro</h1>
            <p className="mt-5 max-w-[38ch] text-muted">Anéis, aparadores, colares, pulseiras e brincos. Peças escolhidas à mão em Salto, SP.</p>
            <Link to="/loja" className="btn mt-8">Ver a loja</Link>
          </div>
          <div className="order-1 aspect-[4/5] overflow-hidden md:order-2">
            <SectionPhoto name="hero" eager alt="Mãos com anéis de prata" />
          </div>
        </section>

        {/* Categorias */}
        <section aria-labelledby="cat-t" className="wrap pb-20 md:pb-28">
          <h2 id="cat-t" className="t-lead">Categorias</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {CATEGORIES.map((c) => {
              const p = cover(c.id);
              if (!p) return null;
              return (
                <li key={c.id}>
                  <Link to={`/loja/${c.id}`} className="block no-underline hover:opacity-80">
                    <div className="aspect-square overflow-hidden"><ProductArt product={p} sizes="(min-width: 768px) 33vw, 50vw" /></div>
                    <p className="mt-3">{c.label}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link to="/loja?material=ouro" className="link link-solo mt-4">Ver as banhadas a ouro 18k</Link>
        </section>

        {/* Destaques */}
        {destaque.length > 0 && (
          <section aria-labelledby="dest-t" className="wrap pb-20 md:pb-28">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="dest-t" className="t-lead">Algumas peças</h2>
              <Link to="/loja" className="link link-solo t-small">Ver todas</Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
              {destaque.map((p) => (
                <li key={p.id}>
                  <Link to={`/peca/${p.slug}`} className="block no-underline hover:opacity-80">
                    <div className="aspect-square overflow-hidden"><ProductArt product={p} /></div>
                    <p className="mt-3 leading-snug">{p.name}</p>
                    <p className="mt-1 text-muted tabular">{brl(p.priceFrom)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Informações */}
        <section aria-labelledby="info-t" className="bg-surface py-16 md:py-20">
          <div className="wrap">
            <h2 id="info-t" className="sr-only">Como comprar</h2>
            <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {INFO.map(([k, v]) => (
                <div key={k}>
                  <dt className="font-semibold">{k}</dt>
                  <dd className="mt-2 text-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Dúvidas */}
        <section aria-labelledby="duvidas-t" className="wrap py-20 md:py-28">
          <h2 id="duvidas-t" className="t-lead">Dúvidas</h2>
          <div className="mt-6 max-w-[760px]">
            {FAQ.map(([q, a], i) => (
              <details key={q} id={i === 0 ? "aro" : undefined} className="border-b border-[#e2e2e2] py-1">
                <summary className="flex min-h-[52px] items-center justify-between gap-4">
                  <span>{q}</span><span aria-hidden="true" className="text-muted">+</span>
                </summary>
                <p className="pb-4 text-muted">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-10 text-muted">
            Ficou alguma dúvida? <a className="link text-ink" href={waLink("Oi, Morena Pratas! Tenho uma dúvida.")} target="_blank" rel="noreferrer">Fale com a gente no WhatsApp</a>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

const FAQ: [string, string][] = [
  ["Como descubro meu aro?", "Passe uma tira de papel em volta do dedo, marque onde fecha e meça em milímetros. Tire 40 desse número: 54 mm é aro 14, 56 mm é aro 16, 58 mm é aro 18, 60 mm é aro 20. Na dúvida entre dois, fique com o maior."],
  ["O que é um aparador?", "Um anel fino usado junto de outro anel, para valorizar e segurar o principal no lugar."],
  ["A prata escurece?", "Com o tempo, sim: suor, perfume e cloro escurecem a prata. Uma flanela própria para prata devolve o brilho em segundos."],
  ["Quanto dura o banho de ouro?", "Depende do uso. Tire a peça no banho, na piscina e no mar, passe perfume antes de colocar e guarde separada das outras."],
  ["Posso dormir de anel?", "Pode, mas a peça dura mais quando descansa. Guarde num saquinho fechado, longe da umidade."],
  ["Como entro na minha conta?", "Sem senha. Você digita seu e-mail, recebe um código de 6 dígitos e entra. Lá ficam seus pedidos."],
  ["Como pago?", "Pix, cartão ou boleto, na página do Mercado Pago. O site não guarda dados de cartão."],
  ["Posso trocar o tamanho?", "Pode. Chame no WhatsApp em até 7 dias depois de receber, com a peça sem uso, e a gente troca pelo aro certo se houver em estoque."],
];
