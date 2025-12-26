# CODEx_PROGRESS - LevelUp Gym

## Summary
- Objective now stores duration weeks + weigh-ins for weekly check-ins.
- Progresso page is now the objective progress view with weeks 1..N and weekly weigh-in CTA.
- Weight mission on Home opens Progresso for the weekly check-in flow.

## Files touched
- src/lib/objectives.ts
- src/components/GoalsSection.tsx
- src/pages/Index.tsx
- src/pages/Progresso.tsx
- CODEx_PROGRESS.md

## How to test (visual)
1) Criar objetivo escolhendo 6 ou 12 semanas no onboarding.
2) Abrir Progresso e conferir semanas 1..N e "Check-ins semanais (X/N)".
3) Registrar peso da semana atual e ver o CTA mudar para editar.
4) Voltar na Home, clicar "Registrar peso (semanal)" e confirmar que abre Progresso com X/N atualizado.
