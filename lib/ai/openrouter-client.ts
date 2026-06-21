import type { VisualAttributes } from '@/types/domain';

import { vocabularyToPromptText, type PetVocabulary } from './pet-vocabulary';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'google/gemini-2.5-flash';

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizeOptionalText(value?: string) {
  const normalized = value ? normalizeText(value) : '';
  return normalized.length > 0 ? normalized : undefined;
}

function parseContent(content: unknown): unknown {
  if (typeof content === 'string') return JSON.parse(content);
  if (content && typeof content === 'object') return content;
  throw new Error('Respons OpenRouter tidak berisi JSON.');
}

function normalize(input: unknown): VisualAttributes {
  const raw = input as Partial<VisualAttributes>;
  if (!raw?.species || !raw?.primaryColor || !raw?.furPattern || typeof raw.confidence !== 'number') {
    throw new Error('Atribut visual tidak lengkap.');
  }

  const result: VisualAttributes = {
    species: normalizeText(raw.species),
    primaryColor: normalizeText(raw.primaryColor),
    furPattern: normalizeText(raw.furPattern),
    confidence: Math.max(0, Math.min(1, raw.confidence)),
  };

  const secondary = normalizeOptionalText(raw.secondaryColor);
  if (secondary) result.secondaryColor = secondary;

  const breed = normalizeOptionalText(raw.estimatedBreed);
  if (breed) result.estimatedBreed = breed;

  return result;
}

function buildPrompt(vocab?: PetVocabulary): string {
  const base =
    'Analyze this pet image and return ONLY a JSON object with fields: species, primaryColor, secondaryColor (optional), furPattern, estimatedBreed (optional), confidence (0-1).';

  if (!vocab) return base;

  const vocabText = vocabularyToPromptText(vocab);
  if (!vocabText) return base;

  return [
    base,
    '',
    'IMPORTANT: Prefer values from this known vocabulary (from the adoption database). Use exact matches when possible. If the image clearly does not match any vocabulary value, use the closest descriptive term in lowercase Indonesian/English.',
    '',
    'Known vocabulary:',
    vocabText,
  ].join('\n');
}

export async function analyzePetImage(
  imageUrl: string,
  vocabulary?: PetVocabulary,
): Promise<VisualAttributes> {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key belum dikonfigurasi di .env.');
  }

  const promptText = buildPrompt(vocabulary);
  console.log('[analyzePetImage] start', {
    imageUrl: imageUrl.slice(0, 80),
    vocabSizes: vocabulary
      ? {
          species: vocabulary.species.length,
          colors: vocabulary.primaryColors.length,
          patterns: vocabulary.furPatterns.length,
          breeds: vocabulary.breeds.length,
        }
      : 'none',
  });

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://adoptpet.local',
        'X-Title': 'AdoptPet Skripsi',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });
  } catch (error) {
    console.error('[analyzePetImage] NETWORK FAILED', error);
    throw new Error('Tidak bisa menghubungi OpenRouter. Periksa koneksi internet.');
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[analyzePetImage] HTTP ERROR', { status: response.status, body });
    throw new Error(`OpenRouter error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  console.log('[analyzePetImage] raw response', JSON.stringify(data).slice(0, 300));

  const content = data?.choices?.[0]?.message?.content;
  const result = normalize(parseContent(content));
  console.log('[analyzePetImage] success', result);
  return result;
}
