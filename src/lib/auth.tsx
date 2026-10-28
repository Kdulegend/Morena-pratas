import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { PREVIEW_MODE } from "@/config";

// Login sem senha: a cliente digita o e-mail, recebe um código de 6 dígitos e entra.
// No Supabase: Authentication → Email Templates → "Magic Link" deve mostrar {{ .Token }} (ver README).

export type User = { id: string; email: string };
type AuthCtx = {
  user: User | null;
  ready: boolean;
  sendCode: (email: string) => Promise<{ error?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
export const DEMO_CODE = "123456";
const DEMO_KEY = "morena-demo-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      try { const raw = localStorage.getItem(DEMO_KEY); if (raw) setUser(JSON.parse(raw)); } catch { /* ignora */ }
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user,
    ready,
    async sendCode(email) {
      if (PREVIEW_MODE || !supabase) return {};
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      return error ? { error: traduz(error.message) } : {};
    },
    async verifyCode(email, code) {
      if (PREVIEW_MODE || !supabase) {
        if (code !== DEMO_CODE) return { error: "Código incorreto. Na prévia, use 123456." };
        const u = { id: "demo", email };
        try { localStorage.setItem(DEMO_KEY, JSON.stringify(u)); } catch { /* ignora */ }
        setUser(u);
        return {};
      }
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      return error ? { error: traduz(error.message) } : {};
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut();
      try { localStorage.removeItem(DEMO_KEY); } catch { /* ignora */ }
      setUser(null);
    },
  }), [user, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function traduz(msg: string) {
  if (/expired|invalid/i.test(msg)) return "Código inválido ou vencido. Peça um novo.";
  if (/rate limit|seconds/i.test(msg)) return "Muitas tentativas. Espere um minuto e tente de novo.";
  return "Não deu certo agora. Tente de novo em instantes.";
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fora do AuthProvider");
  return c;
}
