# AI_CONSTITUTION — LevelUp Gym (regras do agente)

Este projeto é um app de treino focado em **progressão de carga** + **objetivos (campanhas)** + **gamificação**.
O agente (Codex) deve seguir estas regras SEM EXCEÇÃO.

## 0) Regra máxima: NÃO MUDAR A APARÊNCIA
- Proibido alterar tema, paleta, tipografia, espaçamentos, estilos, layout das telas existentes.
- Proibido refatorar CSS/StyleSheet.
- Proibido introduzir nova lib de UI/tema.
- Pode apenas:
  - trocar textos/labels
  - trocar dados exibidos
  - adicionar pequenas seções NO MESMO PADRÃO visual (card/banner usando os mesmos componentes)
  - adicionar ícone "?" para explicações (sem redesenhar)

## 1) Filosofia do produto (imutável)
- **Treino primeiro**: o treino é o core do app.
- Nutrição é **multiplicador de resultado**, não deve bloquear o treino.
- O sistema principal é o **OBJETIVO ATIVO** (campanha).
- A **Conta (level/XP)** é meta-progresso e recebe grande recompensa ao concluir objetivos.

## 2) Gamificação (sem toxicidade)
- Sem “escudo”.
- Penalidade é **mecânica** (atraso/XP/LP), nunca emocional.
- Copy sempre motivadora e curta: “falhar um dia acontece; o importante é voltar”.
- Proibido tom agressivo, culpabilizador ou humilhante.

## 3) Engenharia / mudanças permitidas
- Prioridade: mudanças pequenas, incrementais, seguras.
- Não criar um “novo app dentro do app”.
- Reutilizar stores, serviços e padrões existentes.
- Evitar mexer em pastas/arquitetura.

## 4) Dependências e comandos
- Proibido adicionar/remover dependências sem necessidade explícita.
- Proibido alterar scripts do projeto sem necessidade explícita.
- Evitar rodar comandos automaticamente (a não ser comandos seguros e essenciais).

## 5) Dados e persistência
- Persistência deve seguir o padrão do repo (store/local/firebase).
- Suportar migração suave: usuários antigos podem não ter objetivo ativo.
- Dados importantes:
  - objectiveActive (campanha ativa)
  - accountProgress (XP/level conta)
  - dailyMissions (geradas pelo objetivo)
  - workoutLogs / nutritionLogs (se existir)

## 6) Educação (“ensinar tudo”)
- Explicações em camadas:
  - micro (1–2 linhas)
  - média (4–6 linhas)
  - profunda (modal/página) com referências
- Linguagem simples, prática, sem promessas absolutas.
- “Evidências sugerem…” / “Em geral…” em vez de certezas.

## 7) Fluxo obrigatório de trabalho do agente
1) Diagnóstico: localizar arquivos e padrões existentes.
2) Plano: listar mudanças e arquivos (máx 5 arquivos por etapa).
3) Implementar: funções puras primeiro, UI depois.
4) Atualizar `CODEx_PROGRESS.md` (sempre).
5) Marcar checklist em `DONE_CHECKLIST.md`.

## 8) Arquivos de status (obrigatórios)
- Manter `CODEx_PROGRESS.md` na raiz:
  - Etapa atual
  - O que foi feito
  - Arquivos alterados
  - Como testar visualmente
- Se existir pedido de review, atualizar `CODEx_REVIEW_READY.txt` (timestamp + checklist de teste).
