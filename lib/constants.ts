import { Portions, CyclePhase } from './types';

export const DAILY_TARGETS: Portions = {
  legumes: 3,
  cereals: 3,
  eggs: 2,
  vegetables: 4,
  fruits: 4,
  fats: 3,
  soy_milk: 2,
  yogurt: 1,
};

export const FOOD_GROUPS: Array<{
  key: keyof Portions;
  emoji: string;
  label: string;
  unit: string;
}> = [
  { key: 'legumes', emoji: '🫘', label: 'Legumbres', unit: 'porc.' },
  { key: 'cereals', emoji: '🌾', label: 'Cereales', unit: 'porc.' },
  { key: 'eggs', emoji: '🥚', label: 'Huevos', unit: 'ud.' },
  { key: 'vegetables', emoji: '🥦', label: 'Verduras', unit: 'porc.' },
  { key: 'fruits', emoji: '🍌', label: 'Frutas', unit: 'porc.' },
  { key: 'fats', emoji: '🥑', label: 'Grasas', unit: 'porc.' },
  { key: 'soy_milk', emoji: '🥛', label: 'Leche soya', unit: 'serv.' },
  { key: 'yogurt', emoji: '🫙', label: 'Yogur griego', unit: 'porc.' },
];

export const MEAL_TIMES: Array<{ value: MealTimeOption; label: string }> = [
  { value: 'desayuno', label: '🌅 Desayuno' },
  { value: 'almuerzo', label: '☀️ Almuerzo' },
  { value: 'colación', label: '🍎 Colación' },
  { value: 'cena', label: '🌙 Cena' },
];

type MealTimeOption = 'desayuno' | 'almuerzo' | 'colación' | 'cena';

export const EMPTY_PORTIONS: Portions = {
  legumes: 0,
  cereals: 0,
  eggs: 0,
  vegetables: 0,
  fruits: 0,
  fats: 0,
  soy_milk: 0,
  yogurt: 0,
};

export const NUTRITION_SYSTEM_PROMPT = `Eres un asistente de nutrición experto en el sistema de equivalentes alimentarios colombiano. Analiza la descripción de la comida y responde ÚNICAMENTE con JSON válido.

SISTEMA DE EQUIVALENTES (1 porción =):
- Legumbres: ½ taza frijoles/garbanzos/lentejas/arvejas cocidos
- Cereales: 1 arepa (90g) / 1 tajada pan masa madre (30g) / ½ taza arroz cocido / ½ taza pasta cocida / 1 papa (100g) / ½ taza plátano cocido / ½ taza quinoa cocida / ½ taza avena
- Verduras cocidas: ½ taza brócoli/zanahoria/calabacín/habichuelas/pimentón/espinaca/champiñones. Las verduras crudas (lechuga, pepino, tomate en ensalada) = 0 porciones, no cuentan.
- Frutas: 1 taza papaya / 1 taza piña / 1 banano / 1 taza fresas o arándanos / 2 kiwis / 1 naranja / 1 taza sandía / 1 mango
- Grasas: 10 almendras / 3 nueces / 10 anacardos / ¼ aguacate / 1 cucharada aceite de oliva / 1 cucharada mantequilla de maní natural
- Leche soya: 3 cucharadas (33g) de leche de soya en polvo en 200ml agua = 1 servicio
- Yogur griego: ¾ taza yogur griego natural = 1 porción
- Huevos: 1 huevo entero = 1 unidad

INSTRUCCIONES:
- Convierte las medidas a porciones usando el sistema anterior
- Usa contexto de comida colombiana/latinoamericana (arroz + lentejas + plátano son comunes)
- "taza" = taza estándar (240ml)
- Los números pueden ser decimales (ej: 0.5, 1.5)
- Si la cantidad no es clara, estima basándote en una porción típica colombiana
- Verduras crudas en ensaladas = 0

Responde ÚNICAMENTE con este JSON (sin texto adicional, sin markdown):
{"legumes": number, "cereals": number, "eggs": number, "vegetables": number, "fruits": number, "fats": number, "soy_milk": number, "yogurt": number}`;

export function getCyclePhase(cycleDay: number): CyclePhase {
  if (cycleDay >= 1 && cycleDay <= 13) {
    return {
      name: 'Folicular',
      emoji: '🌸',
      message: 'Buena energía — aprovecha para entrenar fuerte y sube un poco los cereales',
    };
  } else if (cycleDay >= 14 && cycleDay <= 16) {
    return {
      name: 'Ovulación',
      emoji: '⭐',
      message: 'Pico de rendimiento — mantén proteína alta',
    };
  } else {
    return {
      name: 'Lútea',
      emoji: '🌙',
      message: 'Es normal tener más antojos — sube proteína, baja carbos simples',
    };
  }
}

export function sumPortions(logs: Array<{ parsed_portions: Portions }>): Portions {
  return logs.reduce(
    (acc, log) => ({
      legumes: acc.legumes + (log.parsed_portions.legumes || 0),
      cereals: acc.cereals + (log.parsed_portions.cereals || 0),
      eggs: acc.eggs + (log.parsed_portions.eggs || 0),
      vegetables: acc.vegetables + (log.parsed_portions.vegetables || 0),
      fruits: acc.fruits + (log.parsed_portions.fruits || 0),
      fats: acc.fats + (log.parsed_portions.fats || 0),
      soy_milk: acc.soy_milk + (log.parsed_portions.soy_milk || 0),
      yogurt: acc.yogurt + (log.parsed_portions.yogurt || 0),
    }),
    { ...EMPTY_PORTIONS }
  );
}
