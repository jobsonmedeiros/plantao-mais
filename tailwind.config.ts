import type { Config } from "tailwindcss";

// Paleta do Plantão+: azul como cor principal, branco de fundo,
// verde para conclusão, laranja para pendência, vermelho para alerta/rejeição.
// Cada cor tem uma versão "dark" (texto) e "tint" (fundo) para manter contraste
// e permitir que o significado seja dado também por texto, não só por cor.
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#143A66", 600: "#1B4B80", 700: "#0F2D50" },
        brand: { DEFAULT: "#1F5FA6", dark: "#174C86", tint: "#E6EFFA" },
        ok: { DEFAULT: "#1E8F63", dark: "#146347", tint: "#E3F4EC" },
        warn: { DEFAULT: "#D9822B", dark: "#8A4B06", tint: "#FDF0DE" },
        danger: { DEFAULT: "#C94A4A", dark: "#9B2C2C", tint: "#FBE9E9" },
        surface: "#F4F7FB",
        line: "#DCE4EE",
        ink: { DEFAULT: "#17283C", soft: "#51637A" },
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
