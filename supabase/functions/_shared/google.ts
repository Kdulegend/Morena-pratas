// Acesso à planilha do Drive por conta de serviço (sem deixar a planilha pública).
// Secrets: GOOGLE_SERVICE_ACCOUNT_JSON, SHEET_ID.

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
};

async function importKey(pem: string) {
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

export async function googleToken(scope: string) {
  const sa = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")!);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }))}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", await importKey(sa.private_key), new TextEncoder().encode(unsigned));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`Google token: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token as string;
}

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";

export async function readRange(range: string, token: string) {
  const res = await fetch(`${SHEETS}/${Deno.env.get("SHEET_ID")}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Leitura ${range}: ${res.status} ${await res.text()}`);
  return ((await res.json()).values ?? []) as unknown[][];
}

export async function appendRows(range: string, rows: unknown[][], token: string) {
  const res = await fetch(`${SHEETS}/${Deno.env.get("SHEET_ID")}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ values: rows }),
  });
  if (!res.ok) throw new Error(`Append ${range}: ${res.status} ${await res.text()}`);
}

export async function writeCell(range: string, value: unknown, token: string) {
  const res = await fetch(`${SHEETS}/${Deno.env.get("SHEET_ID")}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ values: [[value]] }),
  });
  if (!res.ok) throw new Error(`Escrita ${range}: ${res.status} ${await res.text()}`);
}
