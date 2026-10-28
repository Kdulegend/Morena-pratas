// Baixa as fotos candidatas direto do CDN do Unsplash (licença Unsplash: uso comercial livre).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
const list = JSON.parse(await readFile("imagens/candidatas.json", "utf8"));
await mkdir("imagens/candidatas", { recursive: true });
const log = [];
for (const it of list) {
  if (existsSync(`imagens/candidatas/${it.key}.jpg`)) { log.push(`já tinha ${it.key}`); continue; }
  try {
    const res = await fetch(`${it.src}?w=1400&q=82&fm=jpg&fit=max`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(`imagens/candidatas/${it.key}.jpg`, Buffer.from(await res.arrayBuffer()));
    log.push(`ok ${it.key} ${it.id}`);
  } catch (e) {
    log.push(`falhou ${it.key} ${it.id}: ${e.message ?? e}`);
  }
}
await writeFile("imagens/log.txt", log.join("\n") + "\n");
console.log(log.join("\n"));
