import OpenAI from 'openai';
import { Portions } from './types';
import { NUTRITION_SYSTEM_PROMPT } from './constants';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseMealDescription(description: string): Promise<Portions> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: NUTRITION_SYSTEM_PROMPT },
      { role: 'user', content: description },
    ],
    temperature: 0.1,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error('No response from OpenAI');

  const portions = JSON.parse(content) as Portions;

  return {
    legumes: Math.max(0, portions.legumes || 0),
    cereals: Math.max(0, portions.cereals || 0),
    eggs: Math.max(0, portions.eggs || 0),
    vegetables: Math.max(0, portions.vegetables || 0),
    fruits: Math.max(0, portions.fruits || 0),
    fats: Math.max(0, portions.fats || 0),
    soy_milk: Math.max(0, portions.soy_milk || 0),
    yogurt: Math.max(0, portions.yogurt || 0),
  };
}
