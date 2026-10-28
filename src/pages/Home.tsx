import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Mandrel } from "@/components/Mandrel";
import { JewelDrawing } from "@/components/JewelDrawing";
import { CATEGORIES, brl, isRing, useCatalog, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useReveal } from "@/lib/useReveal";
import { waLink } from "@/config";

type Pick = { product: Product; sku: string; price: number; stock: number };

export default function Home() {
  const { catalog } = useCatalog();
  const products = catalog?.products ?? [];
  const cart = useCart();
  useReveal([catalog]);

  // aros que existem hoje no estoque de anéis e aparadores
  const aros = useMemo(() => {
    const set = new Set<number>();
    products.filter(isRing).forEach((p) => p.variants.forEach((v) => { const n = parseInt(v.size); if (n && v.stock > 0) set.add(n); }));
    return [...set].sort((a, b) => a - b);
  }, [products]);
  const [aro, setAro] = useState<number | null>(null);
  const currentAro = aro ?? (aros.includes(14) ? 14 : aros[0] ?? 16);
  const [picked, setPicked] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);

  const ringsInAro: Pick[] = useMemo(
    () =>
      products.filter(isRing).flatMap((p) => {
        const v = p.variants.find((x) => parseInt(x.size) === currentAro && x.stock > 0) ?? (p.variants.length === 1 && p.variants[0].size === "Único" ? p.variants[0] : undefined);
        return v ? [{ product: p, sku: v.sku, price: v.price, stock: v.stock }] : [];
      }).sort((a, b) => (a.product.category === "aparadores" ? -1 : 0) - (b.product.category === "aparadores" ? -1 : 0) || a.price - b.price),
    [products, currentAro],
  );
  // a primeira tela já chega com uma pilha montada: um aparador, um liso e um solitário
  useEffect(() => {
    if (seeded || !ringsInAro.length) return;
    const pickFirst = (f: (r: Pick) => boolean) => ringsInAro.find(f)?.product.id;
    const seed = [
      pickFirst((r) => r.product.category === "aparadores"),
      pickFirst((r) => r.product.drawing.kind === "anel-liso"),
      pickFirst((r) => r.product.drawing.kind === "anel-solitario"),
    ].filter(Boolean) as string[];
    setPicked(seed);
    setSeeded(true);
  }, [ringsInAro, seeded]);
  const stack = ringsInAro.filter((r) => picked.includes(r.product.id));
  const stackTotal = stack.reduce((n, r) => n + r.price, 0);

  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 5 ? cur : [...cur, id]));
  const chooseAro = (a: number) => { setAro(a); setPicked([]); };
  const takeStack = () => {
    stack.forEach((r) => cart.add({ sku: r.sku, productId: r.product.id, slug: r.product.slug, name: r.product.name, size: String(currentAro), price: r.price, max: r.stock }));
    cart.setOpen(true);
  };

  const ringsFrom = products.filter(isRing).reduce((m, p) => Math.min(m, p.priceFrom), Infinity);
  const stageRings = stack.map((r) => r.product);

  return (
    <>
      <div className="relative lg:grid lg:grid-cols-2">
        {/* O palco: fica parado a visita inteira no desktop */}
        <aside className="sticky top-0 z-0 h-[58svh] p-3 lg:h-svh lg:p-[var(--margin)] lg:pr-0" aria-label="Tribulê com a sua pilha">
          <div className="relative flex h-full items-center justify-center overflow-hidden bg-stage">
            <Mandrel aro={currentAro} rings={stageRings} className="drift h-[94%] w-auto" />
            <p className="absolute left-6 top-6 hidden t-small text-muted lg:block">
              Aro {currentAro}{stack.length > 0 ? ` · ${stack.length} ${stack.length === 1 ? "anel" : "anéis"} · ${brl(stackTotal)}` : ""}
            </p>
          </div>
        </aside>

        <div className="absolute inset-x-0 top-0 z-30 lg:left-1/2">
          <Header home />
        </div>

        <main className="relative z-10 lg:bg-transparent">
          {/* Primeira tela: o nome em largura de cartaz, cruzando a borda do palco */}
          <h1 id="marca" className="hero-mark mark-scroll wrap relative z-10 -mt-[11vw] whitespace-nowrap leading-[0.9] tracking-[-0.045em] lg:absolute lg:right-[var(--margin)] lg:top-[calc(100svh-40px)] lg:m-0 lg:-translate-y-full lg:px-0">
            morena pratas
          </h1>
          <section aria-label="Apresentação" className="bg-bg lg:flex lg:min-h-svh lg:flex-col lg:bg-transparent">
            <div className="wrap grid gap-8 pb-6 pt-6 md:grid-cols-2 md:items-end lg:block lg:pl-[var(--pad)] lg:pt-[38svh]">
              <p className="max-w-[26ch] t-lead reveal" style={{ ["--i" as string]: 1 }}>
                Joias em prata 925 e banho de ouro 18k.{Number.isFinite(ringsFrom) ? ` Anéis a partir de ${brl(ringsFrom)}.` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-6 md:justify-end lg:mt-8 lg:justify-start reveal" style={{ ["--i" as string]: 2 }}>
                <Link to="/loja" className="btn">Ver a loja</Link>
                <a href="#pilha" className="link self-center">ou monte uma pilha de anéis</a>
              </div>
            </div>
          </section>

          {/* Monte sua pilha: a coisa viva da página */}
          <section id="pilha" aria-labelledby="pilha-t" className="wrap bg-bg pb-28 pt-16 lg:bg-transparent lg:min-h-[88svh] lg:pl-[var(--pad)] lg:pr-[var(--margin)] lg:pt-[22svh]">
            <div role="tablist" aria-label="Seu aro" className="flex flex-wrap gap-x-6 gap-y-2 reveal">
              {aros.map((a) => (
                <button
                  key={a}
                  role="tab"
                  aria-selected={a === currentAro}
                  onClick={() => chooseAro(a)}
                  className={`min-h-[44px] tabular transition-colors ${a === currentAro ? "text-ink underline decoration-2 underline-offset-[10px]" : "text-muted hover:text-ink"}`}
                >
                  Aro {a}
                </button>
              ))}
            </div>

            <h2 id="pilha-t" className="t-head mt-10 reveal" style={{ ["--i" as string]: 1 }}>Monte sua pilha</h2>
            <p className="mt-6 max-w-[40ch] text-muted reveal" style={{ ["--i" as string]: 2 }}>
              Escolha seu aro e junte até cinco anéis no tribulê. Só aparece o que temos agora no seu tamanho.
            </p>

            {/* no celular o tribulê volta aqui, perto das escolhas */}
            <div className="mt-8 flex h-[340px] items-center justify-center bg-stage lg:hidden" aria-hidden="true">
              <Mandrel aro={currentAro} rings={stageRings} className="h-[92%] w-auto" />
            </div>

            <ul className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label={`Anéis no aro ${currentAro}`}>
              {ringsInAro.map((r, i) => {
                const on = picked.includes(r.product.id);
                return (
                  <li key={r.product.id} className="reveal" style={{ ["--i" as string]: Math.min(i, 6) }}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(r.product.id)}
                      className={`group flex h-full w-full flex-col p-3 text-left transition-[background-color,transform] duration-200 active:scale-[0.98] ${on ? "bg-field text-field-ink" : "bg-surface hover:bg-[#3a2519]"}`}
                    >
                      <span className={`flex aspect-square items-center justify-center bg-stage`}>
                        <JewelDrawing kind={r.product.drawing.kind} stone={r.product.drawing.stone} material={r.product.material} title={r.product.name} className="h-[78%] w-[78%] transition-transform duration-300 group-hover:scale-105" />
                      </span>
                      <span className="mt-3 leading-snug">{r.product.name.replace(/^Anel (de Prata )?/, "").replace(/ de Prata/, "")}</span>
                      <span className={`mt-1 tabular t-small ${on ? "text-field-muted" : "text-muted"}`}>
                        {r.product.category === "aparadores" ? "Aparador · " : ""}{brl(r.price)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button type="button" className="btn !min-h-[72px] !justify-between" onClick={takeStack} disabled={!stack.length}>
                <span>{stack.length ? "Levar a pilha" : "Escolha um anel"}</span>
                <span className="tabular">{brl(stackTotal)}</span>
              </button>
              <a href="#aro" className="btn btn-quiet !min-h-[72px] !justify-start">Não sei meu aro</a>
            </div>
          </section>

          {/* Peças: o catálogo inteiro numa olhada */}
          <section aria-labelledby="pecas-t" className="wrap bg-bg pb-32 pt-16 lg:bg-transparent lg:pl-[var(--pad)] lg:pr-[var(--margin)]">
            <div className="max-w-[640px]" style={{ containerType: "inline-size" }}>
              <h2 id="pecas-t" className="reveal font-semibold leading-[0.8] tracking-[-0.05em]" style={{ fontSize: "clamp(5rem, 33cqw, 14rem)" }}>
                peças
              </h2>
              <div className="mt-6 flex flex-col gap-[6px]">
                {CATEGORIES.map((c, i) => {
                  const items = products.filter((p) => p.category === c.id);
                  if (!items.length) return null;
                  return (
                    <details key={c.id} open={i === 0} className="group bg-surface reveal" style={{ ["--i" as string]: i }}>
                      <summary className="flex min-h-[56px] items-center justify-between px-[18px] transition-colors hover:bg-[#3a2519]">
                        <span className="font-semibold">{c.label} <span className="font-normal text-muted tabular">· {items.length}</span></span>
                        <span aria-hidden="true" className="text-[1.5rem] leading-none transition-transform duration-200 group-open:rotate-45">+</span>
                      </summary>
                      <ul className="flex flex-col gap-[14px] px-5 pb-6 pt-2">
                        {items.map((p) => (
                          <li key={p.id}>
                            <Link to={`/peca/${p.slug}`} className="flex justify-between gap-6 no-underline hover:opacity-75">
                              <span>{p.name}</span>
                              <span className="tabular whitespace-nowrap">{p.variants.length > 1 && new Set(p.variants.map((v) => v.price)).size > 1 ? "a partir de " : ""}{brl(p.priceFrom)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  );
                })}
                <details className="group bg-surface reveal" style={{ ["--i" as string]: 7 }}>
                  <summary className="flex min-h-[56px] items-center justify-between px-[18px] transition-colors hover:bg-[#3a2519]">
                    <span className="font-semibold">Banhadas a ouro 18k <span className="font-normal text-muted tabular">· {products.filter((p) => p.material === "ouro").length}</span></span>
                    <span aria-hidden="true" className="text-[1.5rem] leading-none transition-transform duration-200 group-open:rotate-45">+</span>
                  </summary>
                  <div className="px-5 pb-6 pt-2">
                    {products.some((p) => p.material === "ouro") ? (
                      <ul className="flex flex-col gap-[14px]">
                        {products.filter((p) => p.material === "ouro").map((p) => (
                          <li key={p.id}><Link to={`/peca/${p.slug}`} className="flex justify-between gap-6 no-underline hover:opacity-75"><span>{p.name}</span><span className="tabular">{brl(p.priceFrom)}</span></Link></li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">As peças banhadas acabaram de sair. <a className="link text-ink" href={waLink("Oi! Quero saber das peças banhadas a ouro.")} target="_blank" rel="noreferrer">Pede no WhatsApp</a> que avisamos quando chegarem.</p>
                    )}
                  </div>
                </details>
              </div>
              <Link to="/loja" className="btn mt-8">Ver todas com desenho e tamanho</Link>
            </div>
          </section>
        </main>
      </div>

      {/* A partir daqui a página sai da divisão e corre na largura toda */}
      <section aria-labelledby="como-t" className="on-field bg-field py-28 text-field-ink md:py-40">
        <div className="wrap grid items-start gap-12 lg:grid-cols-2 lg:gap-0">
          <div className="lg:pr-[var(--pad)]">
            <h2 id="como-t" className="t-head reveal">Como funciona</h2>
            <p className="mt-6 max-w-[34ch] text-field-muted reveal" style={{ ["--i" as string]: 1 }}>
              Tudo o que você precisa saber antes de levar uma peça, numa folha só.
            </p>
            <figure className="mt-12 hidden w-[62%] lg:block reveal" style={{ ["--i" as string]: 2 }}>
              <JewelDrawing kind="aparador" stone={null} material="prata" title="Aparador de prata cravejado" className="w-full" />
              <figcaption className="mt-3 t-small text-field-muted">Aparador cravejado, uma fileira.</figcaption>
            </figure>
          </div>
          <div
            className="reveal bg-[var(--sheet)] px-6 py-14 sm:px-12 lg:ml-[calc(var(--pad)-var(--margin))]"
            style={{ ["--i" as string]: 1, clipPath: "polygon(" + scallop() + ")" }}
          >
            {MENU.map((g) => (
              <div key={g.group} className="mb-11 last:mb-0">
                <h3 className="mb-5 font-semibold">{g.group}</h3>
                <dl className="flex flex-col gap-[18px]">
                  {g.items.map(([k, v, d]) => (
                    <div key={k}>
                      <div className="flex items-baseline gap-3">
                        <dt>{k}</dt>
                        <span aria-hidden="true" className="mb-[5px] flex-1 border-b-4 border-dotted border-[#c3c3be]" />
                        <dd className="tabular text-right">{v}</dd>
                      </div>
                      {d && <p className="mt-1 max-w-[42ch] t-small text-field-muted">{d}</p>}
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carta de quem escolhe as peças */}
      <section aria-labelledby="carta-t" className="wrap grid gap-10 py-40 lg:grid-cols-2 lg:gap-0">
        <figure className="hidden lg:block reveal">
          <div className="flex aspect-[4/5] max-w-[480px] items-center justify-center bg-stage">
            <JewelDrawing kind="brinco-trio" stone="cristal" material="prata" title="Trio de brincos de prata com ponto de luz" className="w-[70%]" />
          </div>
          <figcaption className="mt-3 t-small text-muted">Trio de brincos ponto de luz, um dos primeiros da gaveta.</figcaption>
        </figure>
        <div className="max-w-[540px] lg:pl-[calc(var(--pad)-var(--margin))]">
          <h2 id="carta-t" className="t-lead reveal">Quem escolhe as peças</h2>
          <div className="mt-8 flex flex-col gap-6 leading-[1.6]">
            {LETTER.map((t, i) => <p key={i} className="reveal" style={{ ["--i" as string]: i + 1 }}>{t}</p>)}
          </div>
          <p className="mt-10 t-lead italic reveal">Os dois da Morena Pratas</p>
          <p className="t-small text-muted">Salto, SP</p>
        </div>
      </section>

      {/* Perguntas como texto corrido */}
      <section aria-labelledby="duvidas-t" className="wrap bg-surface py-28 md:py-36">
        <div className="grid gap-10 lg:grid-cols-[1fr_3fr]">
          <h2 id="duvidas-t" className="t-head reveal">Dúvidas</h2>
          <div className="md:columns-2 md:gap-14">
            {FAQ.map(([q, a], i) => (
              <p key={q} id={i === 0 ? "aro" : undefined} className="mb-5 break-inside-avoid leading-[1.55] reveal" style={{ ["--i" as string]: Math.min(i, 5) }}>
                <strong className="font-semibold">{q}</strong> <span className="text-muted">{a}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Fechamento: uma frase, uma ação */}
      <section aria-labelledby="fala-t" className="wrap grid items-center gap-12 py-36 md:grid-cols-2 md:gap-0">
        <div className="flex aspect-square max-w-[420px] items-center justify-center bg-surface reveal">
          <JewelDrawing kind="anel-coracao" stone="vermelho" material="prata" title="Anel solitário coração vermelho" className="w-[68%]" />
        </div>
        <div className="md:pl-[calc(var(--pad)-var(--margin))] lg:pl-[calc(var(--pad)-var(--margin))]">
        <h2 id="fala-t" className="t-head reveal">Fala com a gente</h2>
        <p className="mt-6 max-w-[34ch] t-lead reveal" style={{ ["--i" as string]: 1 }}>
          Não achou seu aro ou quer ver a peça na mão antes? Manda uma mensagem.
        </p>
        <div className="mt-6 flex items-center gap-6 reveal" style={{ ["--i" as string]: 1 }}>
          <a className="btn" href={waLink("Oi, Morena Pratas! Quero ajuda para escolher uma peça.")} target="_blank" rel="noreferrer">Chamar no WhatsApp</a>
          <Link to="/loja" className="link">Ou ver a loja</Link>
        </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

/** Bordas de cima e de baixo recortadas em ondinhas, como papel de cardápio. */
function scallop(n = 26, depth = 10) {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) { const x = (i / n) * 100; pts.push(`${x}% ${i % 2 ? depth : 0}px`); }
  for (let i = n; i >= 0; i--) { const x = (i / n) * 100; pts.push(`${x}% calc(100% - ${i % 2 ? depth : 0}px)`); }
  return pts.join(",");
}

const MENU: { group: string; items: [string, string, string?][] }[] = [
  {
    group: "A peça",
    items: [
      ["Prata 925", "em toda peça de prata", "92,5% de prata pura na liga. É o padrão das joias de prata de verdade."],
      ["Banho de ouro 18k", "sobre prata 925", "Por dentro a peça continua sendo prata 925."],
      ["Embalagem de presente", "inclusa"],
    ],
  },
  {
    group: "Pagamento",
    items: [
      ["Pix", "na hora"],
      ["Cartão de crédito", "Mercado Pago", "Você paga na página do Mercado Pago. O site não vê nem guarda o seu cartão."],
      ["Boleto", "Mercado Pago"],
    ],
  },
  {
    group: "Depois da compra",
    items: [
      ["Retirada em Salto", "sem custo"],
      ["Envio para o Brasil", "frete no pagamento"],
      ["Desistência", "até 7 dias", "Contados do recebimento, como garante o Código de Defesa do Consumidor."],
      ["Garantia", "90 dias", "Contra defeito de fabricação."],
    ],
  },
];

const LETTER = [
  "A Morena Pratas é uma loja de casal, em Salto. A gente separa cada peça na mão e só coloca à venda o que usaria.",
  "Trabalhamos com duas coisas: prata 925 e peças banhadas a ouro 18k sobre prata.",
  "Os aparadores são o nosso xodó. Um anel fino ao lado de outro muda a mão inteira, e é por isso que o tribulê está lá em cima.",
  "Ficou em dúvida de tamanho, de cuidado ou de combinação? Chama a gente. Quem responde somos nós.",
];

const FAQ: [string, string][] = [
  ["Como descubro meu aro?", "Passe uma tira de papel em volta do dedo, marque onde fecha e meça em milímetros. Tire 40 desse número: 54 mm é aro 14, 56 mm é aro 16, 58 mm é aro 18, 60 mm é aro 20. Na dúvida entre dois, fique com o maior."],
  ["O que é um aparador?", "Um anel fino usado junto de outro. Ele segura o anel principal no lugar e completa a pilha."],
  ["A prata escurece?", "Com o tempo, sim: suor, perfume e cloro escurecem a prata. Uma flanela própria para prata devolve o brilho em segundos."],
  ["Quanto dura o banho de ouro?", "Depende do uso. Tire a peça no banho, na piscina e no mar, passe perfume antes de colocar e guarde separada das outras."],
  ["Posso dormir de anel?", "Pode, mas a peça dura mais quando descansa. Guarde num saquinho fechado, longe da umidade."],
  ["Como entro na minha conta?", "Sem senha. Você digita seu e-mail, recebe um código de 6 dígitos e entra. Lá ficam seus pedidos."],
  ["Como pago?", "Pix, cartão ou boleto, na página do Mercado Pago. O site não guarda dados de cartão."],
  ["Posso trocar o tamanho?", "Pode. Chame no WhatsApp em até 7 dias depois de receber, com a peça sem uso, e a gente troca pelo aro certo se houver em estoque."],
];
