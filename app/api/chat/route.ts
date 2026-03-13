import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { parseMealDescription } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { Portions, MealTime, DailyLog } from '@/lib/types';
import { DAILY_TARGETS, FOOD_GROUPS } from '@/lib/constants';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function inferMealTime(hour: number): MealTime {
  if (hour < 10) return 'desayuno';
  if (hour < 13) return 'colación';
  if (hour < 16) return 'almuerzo';
  if (hour < 19) return 'colación';
  return 'cena';
}

function portionStatus(portions: Portions): string {
  return FOOD_GROUPS.map((g) => {
    const remaining = Math.max(0, DAILY_TARGETS[g.key] - portions[g.key]);
    const done = portions[g.key] >= DAILY_TARGETS[g.key];
    return `${g.emoji} ${g.label}: ${+portions[g.key].toFixed(1)}/${DAILY_TARGETS[g.key]} ${done ? '✅' : `(faltan ${+remaining.toFixed(1)})`}`;
  }).join('\n');
}

function buildSystemPrompt(portions: Portions, hour: number): string {
  const mealTime = inferMealTime(hour);
  const isEndOfDay = hour >= 20;

  return `Eres una asistente de nutrición amigable para una atleta ovo-vegetariana colombiana.

PLAN DIARIO:
🫘 Legumbres: 3 | 🌾 Cereales: 3 | 🥚 Huevos: 2 | 🥦 Verduras: 4 | 🍌 Frutas: 4 | 🥑 Grasas: 3 | 🥛 Leche soya: 2 | 🫙 Yogur: 1

SISTEMA DE EQUIVALENTES:
• 1 legumbre = ½ taza fríjol/garbanzos/lentejas cocidos
• 1 cereal = 1 arepa / ½ taza arroz, pasta, quinoa o avena / 1 tajada pan masa madre
• 1 verdura = ½ taza brócoli/zanahoria/zuchinni/pimentón COCIDOS (crudos = 0)
• 1 fruta = 1 banano / 1 taza arándanos, papaya, piña, fresas / 1 mango / 1 naranja
• 1 grasa = 10 almendras / 3 nueces / 10 marañones / 1 cda aceite oliva
• 1 soya = 3 cdas leche soya en polvo | 1 yogur = ¾ taza yogur griego

PROGRESO HOY:
${portionStatus(portions)}

HORA: ${hour}:00 → comida actual inferida: ${mealTime}

DESPENSA:
- Proteínas: garbanzos, fríjol negro, lentejas, soya deshidratada
- Cereales: quinoa, avena, harina de avena, arroz, pasta fettuccini, arepas congeladas, pan masa madre
- Verduras: brócoli congelado, zanahoria, zuchinni, pimentón
- Frutas: arándanos (las demás frescas según temporada)
- Lácteos: yogur griego, leche almendras
- Grasas: almendras, nueces, marañones, aceite de oliva
- Endulzantes: miel, panela molida
- Otros: maicena, crema de leche, especias, limón

INSTRUCCIONES:
1. Cuando recomiendas comida y el usuario confirma que la comió o la va a comer (dice "sí", "listo", "lo comí", "ya lo comí", etc.), llama a log_food() con la descripción y cantidad.
2. Después de registrar: "✅ Anotado en ${mealTime}. Te quedan: [menciona los 2-3 grupos más importantes que aún faltan]"
3. Para RECETAS usa este formato exacto:

🍽️ [Nombre del plato] (versión ComeBien)

Ingredientes ([N] porciones):
• [cantidad tazas/cdas] [ingrediente]

Preparación:
1. [paso breve]

📊 Por porción:
[emoji grupo] [cantidad] | [emoji] [cantidad]

✅ Puedes comer [N] porciones hoy (te quedan [X] [grupo limitante])

4. Recetas: sin azúcar refinada (usa miel/panela/banano maduro), sin mantequilla (usa aceite oliva o nada), alta proteína cuando sea posible, usando ingredientes de su despensa.
5. Si el usuario pregunta qué comer, sugiere opciones específicas con cantidades exactas en tazas/cdas.
${isEndOfDay ? '\nES FIN DEL DÍA (después de las 8pm): Proactivamente muestra un resumen de hoy: qué grupos completó (✅) y cuáles no, con una sugerencia concreta y motivadora para mañana. Sé cálida y celebra lo que logró.' : ''}

Habla en español, tutéala, sé concisa y motivadora. Respuestas normales: máx 4 oraciones. Recetas y resúmenes: más detallados.`;
}

const LOG_FOOD_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'log_food',
    description:
      'Registra comida en el diario cuando el usuario confirma explícitamente que comió o que va a comer algo recomendado. No llames esto por suposición, solo cuando el usuario confirma.',
    parameters: {
      type: 'object',
      properties: {
        food_description: {
          type: 'string',
          description:
            'Descripción completa de la comida con cantidades en tazas o cucharadas. Ej: "½ taza de garbanzos cocidos, 1 banano, 10 almendras"',
        },
      },
      required: ['food_description'],
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const { messages, currentPortions, date } = (await request.json()) as {
      messages: OpenAI.Chat.ChatCompletionMessageParam[];
      currentPortions: Portions;
      date: string;
    };

    const now = new Date();
    const hour = now.getHours();
    const mealTime = inferMealTime(hour);
    const systemContent = buildSystemPrompt(currentPortions, hour);

    const fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
      ...messages,
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: fullMessages,
      tools: [LOG_FOOD_TOOL],
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 900,
    });

    const choice = response.choices[0];
    let loggedFood: DailyLog | null = null;

    // Handle tool call: log the food
    if (choice.message.tool_calls?.length) {
      const toolCall = choice.message.tool_calls[0];

      if (toolCall.type === 'function' && toolCall.function.name === 'log_food') {
        const { food_description } = JSON.parse(toolCall.function.arguments) as {
          food_description: string;
        };

        const parsed_portions = await parseMealDescription(food_description);

        const { data } = await supabase
          .from('daily_logs')
          .insert({
            date,
            meal_time: mealTime,
            description: food_description,
            parsed_portions,
          })
          .select()
          .single();

        loggedFood = data as DailyLog;

        // Build updated totals so AI can confirm remaining
        const updated: Portions = {
          legumes: currentPortions.legumes + parsed_portions.legumes,
          cereals: currentPortions.cereals + parsed_portions.cereals,
          eggs: currentPortions.eggs + parsed_portions.eggs,
          vegetables: currentPortions.vegetables + parsed_portions.vegetables,
          fruits: currentPortions.fruits + parsed_portions.fruits,
          fats: currentPortions.fats + parsed_portions.fats,
          soy_milk: currentPortions.soy_milk + parsed_portions.soy_milk,
          yogurt: currentPortions.yogurt + parsed_portions.yogurt,
        };

        const toolResult = JSON.stringify({
          success: true,
          logged: food_description,
          meal_time: mealTime,
          portions_added: parsed_portions,
          updated_progress: portionStatus(updated),
        });

        const followUp = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            ...fullMessages,
            choice.message,
            { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
          ],
          temperature: 0.7,
          max_tokens: 400,
        });

        return NextResponse.json({
          message: followUp.choices[0].message.content ?? '',
          loggedFood,
        });
      }
    }

    return NextResponse.json({
      message: choice.message.content ?? '',
      loggedFood: null,
    });
  } catch (err) {
    console.error('chat route error:', err);
    return NextResponse.json({ error: 'Error en el chat' }, { status: 500 });
  }
}
