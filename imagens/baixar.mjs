// Baixa as fotos candidatas do Unsplash (licença Unsplash: uso comercial livre) e guarda o crédito.
// Lê a página da foto, pega a imagem oficial (og:image em images.unsplash.com) e baixa em 1400px.
import { readFile, writeFile, mkdir } from "node:fs/promises";
const UA = { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36", "accept-language": "en-US,en;q=0.9" };
const list = JSON.parse(await readFile("imagens/candidatas.json", "utf8"));
await mkdir("imagens/candidatas", { recursive: true });
const creditos = {}, log = [];
for (const it of list) {
  try {
    const pageRes = await fetch(it.page, { headers: UA });
    const html = await pageRes.text();
    const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1] ?? html.match(/content="([^"]+)"[^>]+property="og:image"/)?.[1];
    if (!og) throw new Error(`sem og:image (página ${pageRes.status})`);
    if (og.includes("plus.unsplash.com")) throw new Error("Unsplash+ (pago), ignorada");
    const src = og.replace(/&amp;/g, "&").split("?")[0] + "?w=1400&q=82&fm=jpg&fit=max";
    const res = await fetch(src, { headers: UA });
    if (!res.ok) throw new Error(`imagem ${res.status}`);
    await writeFile(`imagens/candidatas/${it.key}.jpg`, Buffer.from(await res.arrayBuffer()));
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const autor = title.match(/(?:by|por)\s+(.+?)\s+on Unsplash/i)?.[1] ?? html.match(/"name":"([^"]+)","first_name"/)?.[1] ?? null;
    creditos[it.key] = { id: it.id, page: it.page, src, autor, title };
    log.push(`ok ${it.key}`);
  } catch (e) {
    log.push(`falhou ${it.key}: ${e.message ?? e}`);
  }
}
await writeFile("imagens/creditos.json", JSON.stringify(creditos, null, 1));
await writeFile("imagens/log.txt", log.join("\n") + "\n");
console.log(log.join("\n"));
