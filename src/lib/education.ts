import type { EducationKey } from "@/lib/objectives";

export type EducationContent = {
  title: string;
  micro: string;
  medium: string[];
  deep: string[];
  references: string[];
};

export const educationContent: Record<EducationKey, EducationContent> = {
  "objective-strategy": {
    title: "Estrategia do objetivo",
    micro: "Deficit, superavit ou manutencao sao escolhas de energia.",
    medium: [
      "Deficit: comer um pouco menos ajuda a perder gordura.",
      "Superavit: comer um pouco mais ajuda a ganhar massa.",
      "Manutencao: manter calorias ajuda a sustentar resultados.",
      "O foco e consistencia, nao extremos.",
    ],
    deep: [
      "A balanca de energia influencia perda ou ganho de peso.",
      "Treino e proteina preservam massa magra.",
      "A evidencia sugere ajustes pequenos e sustentaveis.",
    ],
    references: [
      "ACSM Position Stand: Nutrition and Athletic Performance.",
      "ISSN Position Stand: Diets and Body Composition.",
      "Hall KD et al. Energy balance and body weight regulation.",
    ],
  },
  "objective-realistic-goals": {
    title: "Metas realistas",
    micro: "Metas moderadas ajudam a manter motivacao e saude.",
    medium: [
      "Mudancas lentas sao mais sustentaveis.",
      "Metas claras evitam frustracao.",
      "Pequenos ajustes somam ao longo das semanas.",
    ],
    deep: [
      "Mudancas de 0,25 a 0,75 kg por semana sao comuns.",
      "Fatores como sono e estresse impactam resultados.",
      "Acompanhar tendencia evita conclusoes por um unico dia.",
    ],
    references: [
      "CDC: Healthy Weight Loss.",
      "WHO Guidelines on Physical Activity and Sedentary Behaviour.",
    ],
  },
  "progressive-overload": {
    title: "Progressao de carga",
    micro: "Seu corpo melhora quando o desafio cresce aos poucos.",
    medium: [
      "Se voce bate o topo das reps, aumente um pouco a carga.",
      "Se nao bateu, mantenha e repita.",
      "Isso evita estagnacao sem forcar lesoes.",
    ],
    deep: [
      "A adaptacao vem da tensao mecanica e volume.",
      "O metodo de dupla progressao e simples e seguro.",
      "A evidencia sugere progressao gradual com tecnica boa.",
    ],
    references: [
      "Schoenfeld BJ. The mechanisms of muscle hypertrophy.",
      "NSCA Essentials of Strength Training.",
    ],
  },
  "workout-why": {
    title: "Por que este treino",
    micro: "Cada treino apoia o objetivo atual.",
    medium: [
      "Cut: manter forca e gasto energetico.",
      "Bulk: mais volume para estimular crescimento.",
      "Manutencao: consistencia para manter ganhos.",
    ],
    deep: [
      "A distribuicao de volume evita sobrecarga excessiva.",
      "A consistencia semanal e o principal fator de resultado.",
    ],
    references: [
      "ACSM Resistance Training Guidelines.",
      "ISSN Resistance Training and Hypertrophy Position Stand.",
    ],
  },
  "nutrition-logging": {
    title: "Por que registrar",
    micro: "Registrar aumenta consciencia e melhora escolhas.",
    medium: [
      "Voce enxerga padroes e ajusta com calma.",
      "Isso ajuda a bater proteina e calorias.",
      "Pequenos desvios ficam claros cedo.",
    ],
    deep: [
      "A evidencia sugere que monitorar aumenta adesao.",
      "Nao precisa ser perfeito, apenas consistente.",
    ],
    references: [
      "NHANES Dietary Monitoring research.",
      "ISSN Position Stand: Diet Tracking and Adherence.",
    ],
  },
  "nutrition-protein": {
    title: "Proteina e resultados",
    micro: "Proteina ajuda saciedade e recuperacao.",
    medium: [
      "Cut: proteina alta protege massa magra.",
      "Bulk: proteina sustenta sintese muscular.",
      "Dividir ao longo do dia melhora adesao.",
    ],
    deep: [
      "Metas entre 1,6 e 2,2 g/kg sao comuns.",
      "A evidencia sugere distribuicao em 3-4 refeicoes.",
    ],
    references: [
      "ISSN Position Stand: Protein and Exercise.",
      "Morton RW et al. Protein and hypertrophy meta-analysis.",
    ],
  },
  "mission-workout": {
    title: "Missao: treino do dia",
    micro: "Treino regular cria progresso real.",
    medium: [
      "Cada sessao soma volume e consistencia.",
      "Pular treinos atrasa o objetivo.",
    ],
    deep: [
      "Volume semanal e consistencia sao os principais motores.",
    ],
    references: [
      "ACSM Resistance Training Guidelines.",
    ],
  },
  "mission-nutrition": {
    title: "Missao: registrar alimentacao",
    micro: "Ver o que come ajuda a ajustar metas.",
    medium: [
      "Facilita manter deficit ou superavit.",
      "Ajuda a bater proteina todos os dias.",
    ],
    deep: [
      "Monitoramento aumenta adesao e resultados.",
    ],
    references: [
      "NHANES Dietary Monitoring research.",
    ],
  },
  "mission-weight": {
    title: "Missao: peso semanal",
    micro: "Medir 1x por semana mostra a tendencia real.",
    medium: [
      "Evita oscilar por agua e sal.",
      "Ajuda a ajustar o plano com calma.",
    ],
    deep: [
      "Tendencia semanal e mais confiavel que um dia isolado.",
    ],
    references: [
      "CDC: Weight Tracking Guidance.",
    ],
  },
  "mission-cardio": {
    title: "Missao: cardio leve",
    micro: "Movimento leve ajuda no deficit sem exaustao.",
    medium: [
      "Caminhar aumenta gasto sem cansar muito.",
      "Tambem melhora humor e recuperacao.",
    ],
    deep: [
      "Atividade leve ajuda a manter o deficit em dias comuns.",
    ],
    references: [
      "WHO Physical Activity Guidelines.",
    ],
  },
  "mission-sleep": {
    title: "Missao: sono",
    micro: "Dormir bem ajuda a recuperar e crescer.",
    medium: [
      "Sono ruim reduz desempenho e aumenta fome.",
      "7 a 9 horas e um bom alvo.",
    ],
    deep: [
      "Sono impacta hormonios e sintese muscular.",
    ],
    references: [
      "National Sleep Foundation Guidelines.",
    ],
  },
};
