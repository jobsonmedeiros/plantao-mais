# Teste de concorrência (manual, duas sessões)

Objetivo: garantir que a mesma troca não seja aprovada duas vezes e que um plantão não entre em duas negociações.
Este teste precisa de **duas conexões ao mesmo tempo**, por isso não cabe no script de transação única.

Para executar o teste SQL transacional no PowerShell:

```powershell
$dbUrl = (supabase status -o env | Select-String '^DB_URL=').Line.Substring(7).Trim('"')
psql $dbUrl -v ON_ERROR_STOP=1 -f supabase/tests/01_isolamento_e_trocas.sql
```

## Preparação
1. Crie duas instituições/usuários como no script `01_isolamento_e_trocas.sql`, mas **faça COMMIT** (use um banco local descartável).
2. Deixe uma solicitação em `awaiting_manager` (proposta aceita).

## A. Dupla aprovação
1. Abra duas sessões `psql`, ambas com `set role authenticated` e o mesmo `request.jwt.claims` de um gerente do setor.
2. Sessão 1: `begin; select public.decide_swap('<request_id>', true);` (NÃO dê commit ainda).
3. Sessão 2: `begin; select public.decide_swap('<request_id>', true);` — ela deve **ficar esperando** (trava na solicitação).
4. Sessão 1: `commit;`. A sessão 2 deve falhar com "Esta solicitação não está aguardando aprovação".
5. Confirme: os dois plantões foram trocados **uma única vez** e existe **uma** linha `approved` em `swap_approvals`.

## B. Dois pedidos para o mesmo plantão
1. Sessão 1 e 2 (cada uma como o dono do plantão, ou a mesma pessoa em duas abas): `select public.create_swap_request('<shift_id>', 'open');` em transações abertas.
2. A segunda deve esperar e depois falhar ("já está em negociação") ou violar o índice único `swap_requests_one_active_per_shift`.

## C. Aprovar enquanto o solicitante cancela
Sessão 1: `cancel_swap_request`. Sessão 2: `decide_swap` ao mesmo tempo. Só uma pode vencer; a outra deve falhar sem alterar plantões.

Registre os resultados no relatório da Etapa 8.
