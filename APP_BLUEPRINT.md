# APP_BLUEPRINT — LevelUp Gym

## 1) Objetivo do app (produto)
Ajudar pessoas a aplicar **progressão de carga** corretamente, com:
- objetivos em formato de **campanhas**
- missões diárias
- educação simples e prática (o “porquê” de tudo)
- gamificação (XP/level/elo visual)

O usuário valida o app **visualmente** (UX simples, sem precisar entender ciência).

## 2) Telas principais (atuais)
- Home: resumo, missões do dia, CTA para treino, nível/XP
- Treino: plano (Upper/Lower etc), “Hoje”, metas de reps/carga
- Nutrição: calorias/macros, registro/sugestões (pode ser básico no free)

## 3) Fluxos principais
### 3.1 Onboarding do objetivo (novo)
Se `objectiveActive` não existir:
1) Mostrar tela “Escolha seu objetivo”
2) Usuário escolhe: Perder Peso / Ganhar Massa / Manutenção
3) Usuário define meta simples (peso alvo ou regra padrão)
4) App cria `objectiveActive` e gera plano + missões

### 3.2 Dia a dia (core loop)
1) Home mostra Objetivo Ativo (principal)
2) Usuário inicia treino do dia
3) Usuário registra séries
4) Missões atualizam + XP diário
5) Educação aparece via “?” (micro/médio/profundo)

### 3.3 Concluir objetivo (novo)
1) Critério de conclusão atingido
2) Tela “Objetivo Concluído”
3) Usuário “Reivindicar recompensa” (Mega XP na conta)
4) App força escolher próximo objetivo

### 3.4 Check-in de treino pendente (novo)
Se ontem era dia planejado e não houve registro:
- Banner: “Você não marcou o treino de ontem. Você foi treinar?”
- Botões: Fui / Não fui / Esqueci de registrar
- Sem escudo, sem culpa, com CTA para retomar.

## 4) Sistema de progresso: dois níveis
### 4.1 Objective Progress (principal)
- objective: tipo + meta + prazo
- progresso em % (0–100)
- objectiveLevel (ex: 1–10) derivado do %

### 4.2 Account Progress (secundário)
- accountXp, accountLevel
- recebe XP diariamente (missões) e XP grande ao concluir objetivos
- desbloqueia cosméticos/temas/elos (opcional)

## 5) Perfis de objetivo (como o app se adapta)
### Perder Peso (cut)
- treino: manter progressão + volume moderado
- sugestão: passos/cardio leve (opcional)
- nutrição: déficit, foco proteína/saciedade
- missões: treino + registro + passos + peso semanal

### Ganhar Massa (bulk)
- treino: progressão + volume um pouco maior
- nutrição: superávit, foco proteína/carbo suporte
- missões: treino + proteína/registro + sono + peso semanal

### Manutenção
- treino: consistência + progressão leve
- nutrição: manutenção flexível
- missões: treino + registro básico + peso semanal

## 6) Regras de progressão (MVP recomendado)
- Double progression (faixa de reps): ex 6–10 ou 8–12
- Se bater topo da faixa com boa forma → aumenta carga na próxima
- Se ficar no meio → tentar +1 rep antes de subir peso
- Se falhar muito → manter carga e reconstruir

## 7) Critérios de conclusão (MVP)
### Perder Peso
- atingir peso-alvo OU redução mínima definida
- manter por 7 dias (evitar flutuação)

### Ganhar Massa
- atingir peso-alvo OU completar X semanas com consistência e tendência positiva
- opcional: “meta de força” como proxy

### Manutenção
- manter faixa (±1kg) por X semanas

## 8) Arquivos/estrutura (reais do repo)

### Telas (pages)
As telas ficam em `src/pages/` e incluem:
- `src/pages/Index.tsx` (Home)
- `src/pages/Treino.tsx` (Treino)
- `src/pages/Nutricao.tsx` (Nutrição)
- `src/pages/ObjectiveOnboarding.tsx` (Onboarding do objetivo)
- `src/pages/ObjectiveCompletion.tsx` (Conclusão do objetivo)
- Outras: `WorkoutDetail.tsx`, `WorkoutSummary.tsx`, `NutritionSummary.tsx`, etc.

### App entry
- `src/App.tsx`
- `src/main.tsx`
- estilos globais: `src/App.css` e `src/index.css`

### Serviços
- `src/services/` (persistência/integrações; seguir padrão existente)


## 9) Arquivos de status
- `CODEx_PROGRESS.md`: obrigatório
- `CODEx_REVIEW_READY.txt`: quando pronto para testes

> Regra: ao implementar features novas, priorizar reutilizar e integrar com as páginas existentes em `src/pages/` sem criar novas estruturas paralelas.

## 10) Escopo de alterações (por pasta)
- Alterações permitidas livremente:
  - `src/pages/**`
  - `src/services/**`
  - `src/components/**` (apenas se necessário para reaproveitamento)
- Alterações com cuidado (somente se necessário):
  - `src/App.tsx`, `src/main.tsx`
- Proibido alterar (a menos que eu peça):
  - `src/App.css`, `src/index.css` e qualquer arquivo de tema/estilo
  - `package.json`, lockfiles
  - `.vscode/**`, `vite.config.*`, `tsconfig*.json`, `.env*`
