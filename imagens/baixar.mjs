// Baixa as fotos candidatas do Unsplash (licença Unsplash: uso comercial livre) e guarda o crédito.
import { readFile, writeFile, mkdir } from "node:fs/promises";
const list = JSON.parse(await readFile("imagens/candidatas.json", "utf8"));
await mkdir("imagens/candidatas", { recursive: true });
const creditos = {};
for (const it of list) {
  try {
    const res = await fetch(`https://unsplash.com/photos/${it.id}/download?force=true&w=1400`, { redirect: "follow" });
    if (!res.ok) throw new Error(res.status);
    await writeFile(`imagens/candidatas/${it.key}.jpg`, Buffer.from(await res.arrayBuffer()));
    // página da foto para o nome do fotógrafo
    const page = await (await fetch(it.page)).text();
    const by = page.match(/"name":"([^"]+)","[^}]*"username":"([^"]+)"/);
    creditos[it.key] = { id: it.id, page: it.page, autor: by?.[1] ?? null, usuario: by?.[2] ?? null };
    console.log("ok", it.key);
  } catch (e) {
    console.log("falhou", it.key, String(e));
  }
}
await writeFile("imagens/creditos.json", JSON.stringify(creditos, null, 1));
