import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth, DEMO_CODE } from "@/lib/auth";
import { PREVIEW_MODE } from "@/config";

export default function Login() {
  const { user, sendCode, verifyCode } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/conta";
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  useEffect(() => { if (step === "code") codeRef.current?.focus(); }, [step]);

  if (user) return <Navigate to={from} replace />;

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await sendCode(email.trim());
    setBusy(false);
    if (r.error) return setErr(r.error);
    setStep("code"); setWait(60);
  }
  async function onCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await verifyCode(email.trim(), code);
    setBusy(false);
    if (r.error) return setErr(r.error);
    nav(from, { replace: true });
  }
  async function resend() {
    setErr("");
    const r = await sendCode(email.trim());
    if (r.error) setErr(r.error); else setWait(60);
  }

  return (
    <>
      <Header />
      <main className="wrap grid min-h-[80svh] gap-12 pb-32 pt-16 md:grid-cols-12 md:pt-[14svh]">
        <div className="md:col-span-5">
          <h1 className="t-head">{step === "email" ? "Entrar" : "Confira seu e-mail"}</h1>
          <p className="mt-6 max-w-[36ch] text-muted">
            {step === "email"
              ? "Sem senha para lembrar. Mandamos um código de 6 dígitos para o seu e-mail e pronto."
              : `Mandamos um código para ${email}. Ele vale por alguns minutos.`}
          </p>
        </div>

        <div className="md:col-span-5 md:col-start-8">
          {PREVIEW_MODE && (
            <p className="mb-6 bg-surface p-4 t-small">
              Prévia: nenhum e-mail é enviado ainda. Use o código <strong className="tabular">{DEMO_CODE}</strong>.
            </p>
          )}
          {step === "email" ? (
            <form onSubmit={onEmail} className="flex flex-col gap-3">
              <label htmlFor="email">Seu e-mail</label>
              <input id="email" type="email" required autoComplete="email" inputMode="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn mt-2 !min-h-[56px]" disabled={busy}>{busy ? "Enviando…" : "Receber código"}</button>
            </form>
          ) : (
            <form onSubmit={onCode} className="flex flex-col gap-3">
              <label htmlFor="code">Código de 6 dígitos</label>
              <input
                id="code"
                ref={codeRef}
                className="field-input otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <button className="btn mt-2 !min-h-[56px]" disabled={busy || code.length < 6}>{busy ? "Conferindo…" : "Entrar"}</button>
              <div className="mt-3 flex flex-wrap gap-6 t-small">
                <button type="button" className="link disabled:no-underline disabled:opacity-60" onClick={resend} disabled={wait > 0}>
                  {wait > 0 ? `Reenviar em ${wait}s` : "Reenviar código"}
                </button>
                <button type="button" className="link" onClick={() => { setStep("email"); setCode(""); setErr(""); }}>Trocar e-mail</button>
              </div>
            </form>
          )}
          {err && <p role="alert" className="mt-4">{err}</p>}
        </div>
      </main>
    </>
  );
}
