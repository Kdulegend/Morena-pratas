/** Tokens vivem em src/index.css como variáveis CSS; o Tailwind só aponta para elas. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        stage: "var(--stage)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        gold: "var(--gold)",
        field: "var(--field-1)",
        "field-ink": "var(--field-1-ink)",
        "field-muted": "var(--field-1-muted)",
      },
      fontFamily: { sans: ["Archivo", "system-ui", "sans-serif"] },
      borderRadius: { none: "0" },
    },
  },
  plugins: [],
};
