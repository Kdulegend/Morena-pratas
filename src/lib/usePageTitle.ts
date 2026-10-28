import { useEffect } from "react";

/** Título único por página (SEO e abas do navegador). */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Morena Pratas` : "Morena Pratas · Joias em prata 925 e banho de ouro";
  }, [title]);
}
