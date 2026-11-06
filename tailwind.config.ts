import type { Config } from "tailwindcss";

// Paleta do Plantão+: o verde-esmeralda é a cor simbólica da enfermagem no
// Brasil (anel de formatura, emblema do COREN) e passa a ser a identidade do
// produto. O azul fica reservado para informação funcional (turno noturno,
// badges neutros), não como cor principal.
// Cada cor tem uma versão "dark" (texto) e "tint" (fundo) para manter contraste
// e permitir que o significado seja dado também por texto, não só por cor.
// Os valores vivem em src/index.css para permitir alternância de tema claro/escuro.
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "rgb(var(--color-navy) / <alpha-value>)",
          600: "rgb(var(--color-navy-600) / <alpha-value>)",
          700: "rgb(var(--color-navy-700) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--color-brand) / <alpha-value>)",
          dark: "rgb(var(--color-brand-dark) / <alpha-value>)",
          tint: "rgb(var(--color-brand-tint) / <alpha-value>)",
        },
        ok: {
          DEFAULT: "rgb(var(--color-ok) / <alpha-value>)",
          dark: "rgb(var(--color-ok-dark) / <alpha-value>)",
          tint: "rgb(var(--color-ok-tint) / <alpha-value>)",
        },
        warn: {
          DEFAULT: "rgb(var(--color-warn) / <alpha-value>)",
          dark: "rgb(var(--color-warn-dark) / <alpha-value>)",
          tint: "rgb(var(--color-warn-tint) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          dark: "rgb(var(--color-danger-dark) / <alpha-value>)",
          tint: "rgb(var(--color-danger-tint) / <alpha-value>)",
        },
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          soft: "rgb(var(--color-ink-soft) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          '"Atkinson Hyperlegible Next"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
