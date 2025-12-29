export const COPY = {
  chips: {
    target: "Alvo",
    effort: "Sobrou",
    rest: "Descanso",
    load: "Carga",
    loadMissing: "Defina carga inicial",
  },

  tooltips: {
    target: "Fique dentro do alvo. Quando bater o topo em todas as séries, você evolui.",
    effort: "Quantas reps você ainda faria com boa execução. 0 = no limite; 1 = dava +1; 2 = dava +2…",
    rest: "Descanso ajuda a manter reps e execução. Ajuste se estiver perdendo desempenho.",
    load: "A carga sugerida é baseada no seu último treino + seu esforço (RIR).",
  },

  summary: {
    title: "Resumo do treino",
    sectionUp: "Próximo passo: subir um pouco",
    sectionKeep: "Manter e consolidar",
    sectionDown: "Ajustar para ficar bem feito",
    noData: "Sem dados suficientes para recomendações.",
    seeTech: "Ver detalhe técnico",
    hideTech: "Ocultar detalhe técnico",
  },

  actions: {
    increase: { label: "Subir", micro: "Você bateu o alvo. Bora evoluir um pouco." },
    maintain: { label: "Manter", micro: "Tá no caminho. Vamos consolidar e subir depois." },
    reduce: { label: "Ajustar", micro: "Vamos baixar um pouco pra manter a execução boa." },
  },

  blocks: {
    missingRir: "Preencha ‘Sobrou quantas?’ nas séries concluídas para continuar.",
  },

  safety: {
    pain: "Se sentir dor aguda/pontual, pare e ajuste. Execução vem antes de carga.",
  },
};

export type CopyTreino = typeof COPY;
