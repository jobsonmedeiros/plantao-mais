# Plantão+

**Escalas de plantão mais claras, organizadas e rastreáveis para equipes de enfermagem.**

O Plantão+ é um projeto de portfólio para apoiar instituições de saúde na organização de escalas e, nas próximas etapas, no fluxo de trocas com validação da gerência.

[![Demo online](https://img.shields.io/badge/demo-online-1E8F63)](https://plantao-mais-lime.vercel.app/)
[![React](https://img.shields.io/badge/React-18-149ECA)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-auth%20em%20integra%C3%A7%C3%A3o-3FCF8E)](https://supabase.com/)

> **Estado publicado: Etapa 1 — fundação visual e navegação.** A demo apresenta a interface e os fluxos planejados. Os dados operacionais são fictícios e não são persistidos. A integração de autenticação depende da configuração do Supabase e ainda não representa o fluxo completo de produção.

## O que o projeto propõe

- Montagem e consulta de escalas por instituição e setor.
- Solicitações de troca entre profissionais, com aceite do colega e decisão final da gerência.
- Validação de cobertura, sobreposição de horários e descanso entre jornadas.
- Histórico e notificações para dar rastreabilidade às alterações.

Esses são objetivos do produto, não funcionalidades operacionais disponíveis na versão publicada.

## Demonstração

Acesse a [demo do Plantão+](https://plantao-mais-lime.vercel.app/). Use a navegação para conhecer as telas. Números, nomes e ações das telas operacionais são demonstrativos; não representam uma instituição ou equipe real.

## Engenharia e arquitetura

Para conhecer o ciclo de desenvolvimento, as decisões técnicas, os limites da versão publicada e o roadmap, consulte o [Artefato de Arquitetura e Engenharia](./DOCUMENTATION.md).

## Stack

- **Interface:** React 18, TypeScript e Vite.
- **Estilos e componentes:** Tailwind CSS, componentes próprios e Lucide.
- **Navegação:** React Router.
- **Autenticação em integração:** Supabase Auth quando as variáveis de ambiente estão configuradas.
- **Hospedagem da demo:** Vercel, com fallback para rotas da aplicação de página única (SPA).

## Executar localmente

Requisitos: Node.js e npm.

```bash
npm ci
npm run dev
```

Para validar tipos e gerar o build de produção:

```bash
npm run typecheck
npm run build
```

Sem configuração do Supabase, é possível conhecer a interface em modo de demonstração. Para testar autenticação, copie `.env.example` para `.env` e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` de um projeto Supabase. **Nunca use a chave `service_role` no navegador.**

## Roadmap

| Etapa | Escopo |
|---|---|
| 1 | Fundação visual, componentes e navegação — publicada |
| 2 | Autenticação, perfil e sessão |
| 3 | Instituições, unidades, setores e convites |
| 4 | Escalas, cobertura e publicação |
| 5 | Solicitações e propostas de troca |
| 6 | Aprovação gerencial e atualização transacional |
| 7 | Notificações e lembretes |
| 8 | Testes de segurança, isolamento, concorrência e auditoria |

Cada etapa será apresentada como concluída somente depois de implementada e validada. A interface de funcionalidades futuras não deve ser interpretada como backend pronto.

## Princípios de engenharia

- A autorização deve ser aplicada no banco com Row Level Security (RLS), não apenas escondida na interface.
- O cadastro público não concede vínculo institucional; o acesso deve vir de convite.
- Alterações de escala e trocas devem ser feitas por funções transacionais do banco.
- Não armazenar dados clínicos de pacientes.
- Avisos trabalhistas do sistema não substituem orientação jurídica.

## Autoria e transparência

Projeto de Jobson Medeiros, desenvolvido com apoio de Claude e GitHub Copilot. As decisões, revisões e validações do projeto são acompanhadas pelo autor.
