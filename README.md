# Plantão+

Plataforma SaaS multi-instituição para escalas e trocas de plantão de enfermagem.

## Estado atual: Etapa 1 (fundação visual e navegação)

Esta etapa entrega a **fundação visual**: identidade, navegação, telas e componentes reutilizáveis.
Os dados apresentados nos módulos operacionais são fictícios e servem apenas para demonstrar a interface;
as ações nessas telas não são persistidas nem alteram escalas oficiais.

- Login e recuperação de senha usam Supabase Auth quando as variáveis do projeto estão configuradas; sem configuração, funcionam apenas em modo de demonstração.
- Dashboards, escalas, profissionais, trocas e aprovações exibem conteúdo fictício; um aviso identifica a demonstração e a ausência de persistência operacional.
- Telas de escalas, profissionais, setores, trocas, aprovações, notificações e configurações, cada uma indicando em qual etapa passa a funcionar.
- O seletor "Ver como" existe só para pré-visualizar os menus de cada perfil. Ele **não é controle de acesso**; a autorização real virá do RLS (Etapa 2) e deve ser removido ou substituído nessa etapa.

## Como rodar

```bash
npm install
npm run dev
npm run typecheck
```

Abra o endereço mostrado pelo Vite (normalmente http://localhost:5173).

## Estrutura

```text
src/
  components/      Layout (AppShell), Logo, ShiftChip, StatCard, EmptyState, PageHeader, AuthLayout
  components/ui/   Button, Card, Badge, Input, Label (estilo Shadcn/UI, escritos à mão)
  lib/             nav.ts (menus por perfil), modules.ts (telas e etapas), role-context.tsx, utils.ts
  pages/           Login, ForgotPassword, Dashboard, SchedulesPage, ModulePage, ModuleRoute, NotFound
```

## Decisões de design

- Azul principal, branco de fundo, verde para conclusão, laranja para pendência, vermelho para alerta.
- Fonte Atkinson Hyperlegible Next, desenhada para leitura clara, importante em telas de celular usadas em plantões noturnos.
- Status e turnos sempre têm texto ou letra além da cor (D, N, F, Fé).
- Navegação lateral no computador; barra inferior no celular, com "Mais" para os itens restantes.

## Próximos passos

- Etapa 2: Supabase (Auth, profiles, institutions, memberships, sector_members) e RLS, com testes de isolamento entre duas instituições.
- Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `.env` (veja `.env.example`). Nunca use `service_role` no navegador.
- PWA (manifest, ícones e service worker) fica para quando houver backend.
