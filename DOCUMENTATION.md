# Artefato de Arquitetura e Engenharia — Plantão+

Este documento descreve o ciclo de desenvolvimento, as decisões técnicas e os limites da versão pública do Plantão+. O repositório está na **Etapa 1: fundação visual e navegação**. Funcionalidades descritas como futuras são objetivos do produto, não capacidades já entregues.

## 1. Planejamento e requisitos

### Problema

Escalas de plantão podem ficar distribuídas entre planilhas, papel e mensagens. Isso dificulta identificar lacunas de cobertura, acompanhar pedidos de troca e manter um histórico confiável das alterações.

### Objetivo do produto

Desenvolver uma aplicação multi-instituição para organizar escalas de enfermagem e apoiar trocas entre profissionais com validação gerencial.

### Requisitos orientadores

- Consultar escalas por instituição, setor, profissional e período.
- Identificar cobertura insuficiente e conflitos de horário.
- Registrar uma negociação de troca sem alterar a escala oficial antes da aprovação exigida.
- Restringir cada usuário aos dados institucionais autorizados.
- Oferecer uma interface responsiva e acessível em computadores e celulares.
- Não coletar nem armazenar dados clínicos de pacientes.

Esses requisitos orientam o roadmap. A versão publicada não executa ainda os fluxos operacionais de escala e troca.

## 2. Arquitetura e decisões técnicas

### Stack da versão publicada

| Área | Tecnologia | Uso |
|---|---|---|
| Interface | React 18 e TypeScript | Componentes e páginas da aplicação |
| Build e desenvolvimento | Vite | Servidor local e build estático |
| Estilos | Tailwind CSS | Layout responsivo e tokens visuais |
| Navegação | React Router | Rotas da aplicação de página única |
| Ícones | Lucide | Ícones consistentes nas telas |
| Autenticação em integração | Supabase Auth | Chamadas opcionais quando as variáveis de ambiente estão configuradas |
| Hospedagem | Vercel | Publicação da aplicação e fallback das rotas SPA |

### Estado dos dados

A versão pública da Etapa 1 não inclui migrations nem uma integração operacional das escalas, profissionais, trocas e aprovações. As telas dessas áreas usam conteúdo de demonstração; ações não persistem dados nem alteram uma escala oficial.

O cliente Supabase e o contexto de autenticação estão no código. Seu funcionamento depende da configuração de um projeto Supabase e não significa que o fluxo completo de produção ou a autorização institucional estejam validados.

### Arquitetura-alvo

Nas etapas seguintes, o Supabase/PostgreSQL será a fonte de verdade. A arquitetura planejada separa:

1. **Interface React:** coleta intenção e apresenta dados autorizados.
2. **Autenticação:** identifica o usuário por uma sessão Supabase Auth.
3. **Autorização no banco:** RLS limita leituras ao escopo institucional; funções SQL transacionais validam operações de negócio.
4. **Persistência:** entidades institucionais, vínculos, escalas, plantões, trocas, aprovações, notificações e auditoria.

Essa arquitetura-alvo ainda não está toda presente na versão pública. A chave `service_role` nunca deve ser usada no navegador.

## 3. Desenvolvimento e estrutura do código

Na versão publicada, o código está organizado por páginas, componentes e utilitários compartilhados:

```text
src/
  components/       layout, navegação e componentes reutilizáveis
  components/ui/    elementos de interface
  lib/              cliente Supabase, contexto, navegação e catálogo de módulos
  pages/            páginas e telas da aplicação
public/             recursos estáticos
```

Arquivos de referência:

- `src/App.tsx`: declara as rotas.
- `src/main.tsx`: inicializa React e os provedores.
- `src/components/AppShell.tsx`: layout principal, navegação lateral e navegação móvel.
- `src/lib/auth-context.tsx`: estado de autenticação e chamadas ao Supabase Auth.
- `src/lib/supabase.ts`: criação do cliente Supabase usando variáveis `VITE_*`.
- `src/lib/modules.ts`: catálogo de telas e etapa planejada de ativação.
- `vercel.json`: direciona as rotas da SPA para `index.html`.

## 4. Qualidade, segurança e validação

### Verificações da publicação da Etapa 1

- `npm run typecheck` e `npm run build` passaram no snapshot publicado.
- A demo em produção respondeu nas rotas `/`, `/app`, `/login` e `/escalas`.
- O fallback da Vercel foi validado abrindo diretamente uma rota interna, como `/app`.

Essas verificações não substituem testes funcionais de autenticação, integração com banco, RLS ou operações de escala. O projeto ainda precisa ampliar sua automação de testes.

### Princípios de segurança para as próximas etapas

- Aplicar RLS em todas as tabelas institucionais e testar acesso cruzado entre instituições.
- Não confiar em papel ou instituição definidos pelo navegador para autorizar uma operação.
- Não conceder ao cliente escrita direta em escalas e negociações; usar funções SQL transacionais.
- Não permitir que cadastro público crie acesso institucional; o vínculo deve ser criado por convite.
- Testar cenários concorrentes e garantir rollback completo em falhas.
- Não armazenar dados clínicos de pacientes.

## 5. Publicação e entrega

- O código é hospedado no GitHub, na branch `main`.
- A demo é publicada na Vercel a partir do repositório.
- `vercel.json` configura o fallback necessário para navegar diretamente a rotas da SPA.
- O build local é gerado por `npm run build`.

O repositório não declara um pipeline próprio do GitHub Pages ou um workflow de GitHub Actions como mecanismo de publicação.

## 6. Manutenção e evolução

O trabalho será conduzido em etapas verificáveis, sem tratar protótipos visuais como funcionalidades concluídas:

1. **Fundação visual e navegação:** estrutura responsiva, componentes e apresentação das telas. Publicada.
2. **Autenticação e perfil:** sessão Supabase, perfil e rotas privadas.
3. **Instituições e equipe:** unidades, setores, vínculos e convites.
4. **Escalas:** criação, edição, cobertura, publicação e consulta.
5. **Trocas:** solicitações diretas e mural de propostas.
6. **Aprovações:** validação gerencial e atualização transacional dos plantões.
7. **Notificações:** eventos em tempo real e lembretes.
8. **Qualidade e auditoria:** isolamento, escrita não autorizada, concorrência, acessibilidade e revisão final.

Relatórios e analytics ficam planejados para uma versão futura. Alertas de regras trabalhistas são informativos e não constituem parecer jurídico.

## Transparência de autoria

O projeto é de Jobson Medeiros e foi desenvolvido com apoio de Claude e GitHub Copilot. Ferramentas de IA apoiam o processo; o histórico de publicação identifica o autor do projeto.
