export type GlossaryCategory = "Treino" | "Nutricao" | "Seguranca";

export interface GlossaryItem {
  id: string;
  category: GlossaryCategory;
  title: string;
  aka?: string[];
  short: string;
  practical: string;
  examples: string[];
  technical: string;
}

export const GLOSSARIO: GlossaryItem[] = [
  {
    id: "rir",
    category: "Treino",
    title: "RIR (reps na reserva)",
    aka: ["Sobrou quantas", "Esforço"],
    short: "Quantas repetições ainda caberiam com boa forma.",
    practical: "Use 0–4 para guiar carga. 0 = no limite; 1–2 = seguro para compostos; 0–1 em isoladores.",
    examples: [
      "Banco: fez 8 reps e dava mais 1 boa → RIR 1",
      "Rosca: fez 12 reps e dava mais 2 → RIR 2",
    ],
    technical: "Escala subjetiva que correlaciona proximidade da falha concêntrica. Usada para prescrição e progressão de carga.",
  },
  {
    id: "double-progression",
    category: "Treino",
    title: "Double progression",
    aka: ["Faixa de reps"],
    short: "Bata o topo da faixa em todas as séries antes de subir carga.",
    practical: "Ex.: alvo 6–10. Quando fizer 3x10 com RIR adequado, aumente a carga mínima possível na próxima sessão.",
    examples: [
      "3x10 @ 80kg (RIR 1–2) → próxima usar ~82,5kg",
      "3x8 @ 80kg → mantenha e busque 9–10 na próxima",
    ],
    technical: "Progressão linear dupla: primeiro reps dentro da faixa, depois incremento de carga. Reduz platô e mantém técnica.",
  },
  {
    id: "descanso",
    category: "Treino",
    title: "Descanso entre séries",
    aka: ["Rest"],
    short: "Tempo para manter reps e execução estáveis.",
    practical: "Compostos: ~2–3min. Isoladores: ~1–2min. Se reps caem demais, aumente um pouco.",
    examples: [
      "Supino: 2min entre séries",
      "Rosca: 90s entre séries",
    ],
    technical: "Permite ressíntese de fosfocreatina e recuperação neural. Tempos maiores mantêm performance em compostos pesados.",
  },
  {
    id: "seguranca",
    category: "Seguranca",
    title: "Dor vs. desconforto",
    aka: ["Safety"],
    short: "Desconforto muscular é esperado; dor aguda/pontual é sinal para parar.",
    practical: "Se sentir dor articular ou fisgada, pare, reduza carga ou pule o exercício.",
    examples: [
      "Dor no ombro ao descer supino → reduzir carga/amplitude",
      "Fisgada na lombar no terra → parar e revisar técnica",
    ],
    technical: "Dor aguda pode indicar risco de lesão. Priorize técnica e progressão gradual.",
  },
  {
    id: "nutricao-basica",
    category: "Nutricao",
    title: "Proteína e energia",
    aka: ["Macros"],
    short: "Proteína suficiente e calorias alinhadas ao objetivo.",
    practical: "1,6–2,0 g/kg de proteína/dia; ajuste calorias conforme objetivo (leve déficit ou leve superávit).",
    examples: [
      "80 kg → 130–160 g de proteína/dia",
      "Cut: reduza 100–200 kcal/semana se peso não mexer",
    ],
    technical: "Proteína preserva massa magra; ajuste calórico deve ser moderado para evitar perda de performance.",
  },
];
