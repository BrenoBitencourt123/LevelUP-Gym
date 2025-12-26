# DONE_CHECKLIST — Critérios de aceite (LevelUp Gym)

Marque quando estiver OK.

## Aparência (obrigatório)
- [ ] Nenhuma alteração em tema/cores/spacing/tipografia/layout das telas existentes
- [ ] Nenhuma lib de UI nova
- [ ] Componentes reutilizados no mesmo padrão visual

## Objetivo ativo (campanha)
- [ ] Se não existir objetivo ativo, abre tela de “Escolher objetivo”
- [ ] Home mostra Objetivo Ativo como elemento principal (conta fica secundária)
- [ ] Objetivo ativo persiste (reabre o app e continua)

## Adaptação por objetivo
- [ ] Treino mostra “Foco: Cut/Bulk/Manutenção” (sem mudar UI)
- [ ] Nutrição mostra “Estratégia: déficit/superávit/manutenção”
- [ ] Missões mudam conforme objetivo ativo

## Conclusão e recompensas
- [ ] Objetivo conclui com critérios claros
- [ ] Tela de conclusão aparece
- [ ] “Reivindicar recompensa” aplica Mega XP na conta
- [ ] Após concluir, força escolher próximo objetivo (pode repetir)

## Check-in de treino pendente
- [ ] Se ontem não foi registrado: banner “Você foi treinar?”
- [ ] Botões: Fui / Não fui / Esqueci
- [ ] “Não fui” aplica consequência mecânica (leve) + copy motivadora + CTA treino de hoje
- [ ] Sem escudo

## Educação
- [ ] Ícone “?” ou “Saiba mais” nos pontos-chave (objetivo, progressão, nutrição, missões)
- [ ] Explicação em camadas: micro/médio/profundo
- [ ] Linguagem simples, sem promessas absolutas

## Status e teste
- [ ] `CODEx_PROGRESS.md` atualizado com resumo + arquivos + como testar visualmente
- [ ] App compila e roda sem erro
- [ ] Fluxo completo testável: criar objetivo → completar missão → concluir objetivo → escolher novo
