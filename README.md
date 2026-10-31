# 🏥 Plantão+

Plataforma SaaS para gestão de escalas de plantão hospitalar. Permite que hospitais, clínicas e UPAs montem escalas mensais, que profissionais proponham trocas entre si e que a gerência aprove as alterações antes de atualizar a escala oficial.

> **Status:** Etapa 1 concluída (frontend estruturado). Roadmap em 7 etapas documentado no código.

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

---

## 🎯 O problema

Escalas de plantão em hospitais são montadas em planilhas ou papel. Isso gera:

- Plantões descobertos (ninguém percebe que um turno ficou vazio)
- Trocas informais por WhatsApp, sem registro nem aprovação
- Conflito de horários descoberto só na hora do plantão

O **Plantão+** centraliza o ciclo completo: montagem → publicação → negociação de troca → aprovação → escala oficial atualizada.

---

## 🧠 Decisões técnicas

| Decisão | Motivo |
|---------|--------|
| **RBAC via contexto + RLS no banco** | O menu esconde rotas no front, mas a autorização real fica no Postgres (Row Level Security). Esconder no front é UX; bloquear no banco é segurança. |
| **Roadmap embutido no código** | Cada módulo tem um campo `stage` (`src/lib/modules.ts`). Qualquer dev sabe, lendo o código, o que já funciona e o que é placeholder. |
| **Placeholders honestos** | Nenhuma tela finge ter dados. Cards vazios dizem "disponível na Etapa X". Evita protótipo que parece pronto mas não é. |
| **Acessibilidade como requisito, não extra** | Skip link, `aria-label`, `role="status"` com `aria-live`, foco visível global e respeito a `prefers-reduced-motion`. |
| **Escala lida por letra, não só cor** | Chips mostram `D`, `N`, `F`, `Fé` junto da cor. Daltônicos conseguem ler a grade. |
| **Mobile-first com bottom nav** | Profissional consulta plantão no corredor do hospital, no celular. |

---

## 🏗️ Arquitetura

### Estrutura de pastas

- **`src/components/`**
  - `AppShell`, `AuthLayout`, `ShiftChip`, `StatCard` (componentes de layout e negócio)
  - `ui/` (Design system: `Button`, `Card`, `Badge` — padrão shadcn/ui)
- **`src/lib/`**
  - `modules.ts` (Catálogo de módulos + etapa de ativação)
  - `nav.ts` (Rotas por perfil + função `isPathAllowed()`)
  - `role-context.tsx` (Contexto de papel: `admin` | `manager` | `professional`)
- **`src/pages/`**
  - Uma página por rota (ex: `Dashboard.tsx`, `Login.tsx`)
- **`supabase/`**
  - Migrations e schema (Etapa 2+)

### Fluxo principal

1. Admin cadastra instituição
2. Gerente cria setores e convida profissionais
3. Gerente monta e publica a escala mensal
4. Profissional vê "Minha escala"
5. Profissional propõe troca com colega
6. Colega aceita a proposta
7. Gerente aprova ou rejeita
8. Escala oficial é atualizada
9. Todos os envolvidos são notificados

### Perfis e permissões

| Perfil | Módulos acessíveis |
|--------|--------------------|
| **Administrador** | Instituições, Setores, Profissionais, Relatórios, Configurações |
| **Gerência** | Escalas, Profissionais, Setores, Trocas, Aprovações, Relatórios |
| **Profissional** | Minha escala, Escala dos colegas, Trocar plantão, Solicitações, Notificações, Perfil |

---

## 🗺️ Roadmap

| Etapa | Entrega | Status |
|-------|---------|--------|
| 1 | Estrutura, navegação e todos os layouts | ✅ Concluído |
| 2 | Supabase Auth + perfil real | 🔜 Próxima |
| 3 | CRUDs: instituições, setores, profissionais | ⬜ |
| 4 | Montagem e publicação de escalas | ⬜ |
| 5 | Fluxo de trocas entre profissionais | ⬜ |
| 6 | Aprovação pela gerência | ⬜ |
| 7 | Notificações | ⬜ |
| v2 | Relatórios e analytics | ⬜ |

---

## 🚀 Como rodar localmente

```bash
git clone https://github.com/jobsonmedeiros/plantao-mais.git
cd plantao-mais
npm install
cp .env.example .env    # preencha com suas chaves do Supabase
npm run dev
