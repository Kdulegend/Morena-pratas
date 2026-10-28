// Regras que transformam as linhas da aba "Estoque" da planilha em catálogo do site.
// Fonte única: usada pelo script da GitHub Action (Node) e pela Edge Function sync-estoque (Deno).
// Nunca leva para o site: custo, fornecedor, datas ou qualquer coluna não listada em COLS.

export const COLS = {
  sku: ["sku interno", "sku morena", "sku", "código da peça interno"],
  name: ["produto", "item"],
  size: ["tamanho"],
  stock: ["quantidade em estoque", "saldo em estoque", "estoque"],
  price: ["preço de venda (r$)", "preço de venda", "preço venda", "valor venda"],
  photo: ["foto (url)", "foto", "imagem"],
  description: ["descrição", "descricao"],
  active: ["ativo no site", "ativo"],
};

const CATEGORY_BY_PREFIX = {
  AN: "aneis",
  CO: "colares",
  PU: "pulseiras",
  BR: "brincos",
  TO: "tornozeleiras",
};

export const CATEGORIES = [
  { id: "aneis", label: "Anéis" },
  { id: "aparadores", label: "Aparadores" },
  { id: "colares", label: "Colares" },
  { id: "pulseiras", label: "Pulseiras" },
  { id: "brincos", label: "Brincos" },
  { id: "tornozeleiras", label: "Tornozeleiras" },
];

export const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function parseMoney(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  let s = String(v).replace(/[^\d.,-]/g, "");
  if (!s) return 0;
  // "1.234,56" -> 1234.56 ; "69.90" -> 69.9 ; "69,90" -> 69.9
  if (s.includes(",") && s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function slugify(s) {
  return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function findCol(header, names) {
  const h = header.map(norm);
  for (const n of names) {
    const i = h.indexOf(norm(n));
    if (i >= 0) return i;
  }
  return -1;
}

/** Descobre o tipo de desenho e a cor da pedra a partir do nome (enquanto não há foto). */
export function drawingFor(name, category) {
  const n = norm(name);
  const stone =
    n.includes("vermelh") ? "vermelho" :
    n.includes("verde") ? "verde" :
    n.includes("azul") ? "azul" :
    n.includes("rosa") ? "rosa" :
    n.includes("turmalina") ? "rosa" :
    n.includes("perola") ? "perola" :
    n.includes("cravejad") || n.includes("ponto de luz") || n.includes("cristal") || n.includes("zirconia") ? "cristal" :
    null;
  let kind = "anel";
  if (category === "aparadores") kind = "aparador";
  else if (category === "aneis") kind = n.includes("coracao") ? "anel-coracao" : stone ? "anel-solitario" : "anel-liso";
  else if (category === "colares") kind = n.includes("choker") ? "choker" : n.includes("masculin") || n.includes("corrente") ? "corrente" : n.includes("coracao") ? "colar-coracao" : "colar-ponto";
  else if (category === "pulseiras") kind = n.includes("bracelet") ? "bracelete" : n.includes("perola") ? "pulseira-perolas" : n.includes("coracao") ? "pulseira-coracao" : "pulseira";
  else if (category === "brincos") kind = n.includes("trio") ? "brinco-trio" : n.includes("quadrad") || n.includes("retangular") || n.includes("triangulo") ? "argola-quadrada" : n.includes("oval") || n.includes("gota") ? "argola-gota" : n.includes("folha") ? "brinco-folhas" : "argola";
  else if (category === "tornozeleiras") kind = n.includes("estrela") ? "tornozeleira-estrela" : n.includes("concha") ? "tornozeleira-concha" : "tornozeleira-coracao";
  return { kind, stone };
}

/**
 * rows: matriz (primeira linha = cabeçalho).
 * Retorna { products, hidden } — hidden lista o que ficou fora e por quê (para o relatório de sincronização).
 */
export function rowsToCatalog(rows) {
  const [header, ...body] = rows;
  const c = Object.fromEntries(Object.entries(COLS).map(([k, names]) => [k, findCol(header, names)]));
  if (c.sku < 0 || c.name < 0 || c.stock < 0 || c.price < 0) {
    throw new Error("Cabeçalho não reconhecido. Preciso das colunas SKU, Produto, Quantidade em estoque e Preço de venda.");
  }
  const byBase = new Map();
  const hidden = [];

  for (const r of body) {
    const sku = String(r[c.sku] ?? "").trim().toUpperCase();
    if (!sku || sku === "TOTAL") continue;
    const name = String(r[c.name] ?? "").trim();
    const parts = sku.split("-");
    const prefix = parts[0];
    let category = CATEGORY_BY_PREFIX[prefix];
    if (!category) { hidden.push({ sku, name, motivo: "categoria fora do site" }); continue; }
    if (category === "aneis" && norm(name).includes("aparador")) category = "aparadores";

    const material = parts.includes("OURO") || norm(name).includes("banho de ouro") ? "ouro" : "prata";
    const price = parseMoney(r[c.price]);
    const stock = Math.round(parseMoney(r[c.stock]));
    const activeRaw = c.active >= 0 ? norm(r[c.active]) : "";
    const active = !["nao", "não", "n", "false", "0"].includes(activeRaw);

    if (!active) { hidden.push({ sku, name, motivo: "marcado como inativo" }); continue; }
    if (!(price > 0)) { hidden.push({ sku, name, motivo: "sem preço de venda" }); continue; }
    if (stock <= 0) { hidden.push({ sku, name, motivo: stock < 0 ? "saldo negativo na planilha" : "sem estoque" }); continue; }

    // O tamanho fica no último segmento do SKU quando ele tem 5 partes (ex.: AN-P925-COR-004-14).
    const base = parts.length >= 5 ? parts.slice(0, 4).join("-") : sku;
    const sizeRaw = String(r[c.size] ?? "").trim();
    const size = !sizeRaw || norm(sizeRaw) === "na" || norm(sizeRaw) === "un" ? "Único" : sizeRaw.replace(/cm$/i, " cm").replace(/^(\d+)$/, category === "colares" ? "$1 cm" : "$1");

    const cleanName = name.replace(/\s+/g, " ");
    if (!byBase.has(base)) {
      byBase.set(base, {
        id: base,
        slug: slugify(cleanName + "-" + base.split("-").slice(-1)[0]),
        name: cleanName,
        category,
        material,
        description: c.description >= 0 ? String(r[c.description] ?? "").trim() : "",
        photo: c.photo >= 0 ? String(r[c.photo] ?? "").trim() || null : null,
        drawing: drawingFor(cleanName, category),
        variants: [],
      });
    }
    byBase.get(base).variants.push({ sku, size, price, stock });
  }

  const products = [...byBase.values()].map((p) => {
    p.variants.sort((a, b) => (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0));
    p.priceFrom = Math.min(...p.variants.map((v) => v.price));
    return p;
  });
  products.sort((a, b) => CATEGORIES.findIndex((x) => x.id === a.category) - CATEGORIES.findIndex((x) => x.id === b.category) || a.priceFrom - b.priceFrom);
  return { products, hidden };
}
