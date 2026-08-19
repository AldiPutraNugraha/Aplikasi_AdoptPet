import type { VisualAttributes } from '@/types/domain';

import { vocabularyToPromptText, type PetVocabulary } from './pet-vocabulary';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'google/gemini-2.5-flash';

export class NotAPetImageError extends Error {
  constructor(message = 'Gambar yang Anda unggah bukan hewan. Silakan pilih foto hewan peliharaan (kucing, anjing, dll).') {
    super(message);
    this.name = 'NotAPetImageError';
  }
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizeOptionalText(value?: string) {
  const normalized = value ? normalizeText(value) : '';
  return normalized.length > 0 ? normalized : undefined;
}

function parseContent(content: unknown): unknown {
  if (content && typeof content === 'object') return content;
  if (typeof content !== 'string') throw new Error('Respons OpenRouter tidak berisi JSON.');

  const trimmed = content.trim();
  if (trimmed.length === 0) throw new Error('Respons OpenRouter kosong. Coba foto lain atau coba lagi.');

  // Strip markdown fences (```json ... ```) if present
  const cleaned = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting JSON object from surrounding text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new Error('Respons AI tidak valid. Coba foto lain atau coba lagi.');
  }
}

function normalize(input: unknown): VisualAttributes {
  const raw = input as Partial<VisualAttributes> & { isPet?: boolean };

  if (raw?.isPet === false) {
    throw new NotAPetImageError();
  }

  if (!raw?.species || !raw?.primaryColor || !raw?.furPattern || typeof raw.confidence !== 'number') {
    throw new NotAPetImageError();
  }

  const speciesText = normalizeText(String(raw.species));
  const invalidSpecies = ['null', 'unknown', 'tidak diketahui', 'none', 'n/a', 'na', ''];
  if (invalidSpecies.includes(speciesText)) {
    throw new NotAPetImageError();
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
  const base = [
    'You are analyzing an image to help someone search for adoptable pets.',
    '',
    'FIRST, determine if the image contains a real pet animal (cat, dog, rabbit, bird, hamster, or similar companion animal).',
    '',
    'If the image does NOT contain a pet animal (e.g. it shows a human, object, food, document, QR code, screenshot, landscape, cartoon, or any non-animal subject), return ONLY: {"isPet": false}.',
    '',
    'If the image DOES contain a pet animal, return ONLY a JSON object with fields: isPet (true), species, primaryColor, secondaryColor (optional), furPattern, estimatedBreed (optional), confidence (0-1).',
    '',
    'Do not guess or invent pet attributes for non-animal images. Be strict — if unsure, return isPet: false.',
  ].join('\n');

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
  const content = data?.choices?.[0]?.message?.content;
  const finishReason = data?.choices?.[0]?.finish_reason;
  console.log('[analyzePetImage] raw response', {
    contentType: typeof content,
    contentLength: typeof content === 'string' ? content.length : null,
    contentPreview: typeof content === 'string' ? content.slice(0, 100) : String(content),
    finishReason,
  });

  if (content === undefined || content === null) {
    throw new Error('AI tidak mengembalikan hasil. Coba foto lain atau coba lagi.');
  }

  const result = normalize(parseContent(content));
  console.log('[analyzePetImage] success', result);
  return result;
}
