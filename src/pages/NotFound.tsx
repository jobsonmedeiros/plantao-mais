import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <ThemeToggle className="absolute right-4 top-4 md:right-6 md:top-6" />
      <h1 className="text-2xl font-bold text-ink">Página não encontrada</h1>
      <p className="max-w-sm text-ink-soft">O endereço que você abriu não existe. Volte para o início e tente de novo.</p>
      <Link to="/login" className={buttonVariants()}>
        Ir para o login
      </Link>
    </main>
  );
}
