import { z } from 'zod';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'google/gemini-2.5-flash';

export const VisualAttributesSchema = z.object({
  species: z.string().min(1),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().optional(),
  furPattern: z.string().min(1),
  estimatedBreed: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type VisualAttributes = z.infer<typeof VisualAttributesSchema>;

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizeOptionalText(value?: string) {
  const normalized = value ? normalizeText(value) : '';
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeVisualAttributes(input: unknown): VisualAttributes {
  const parsed = VisualAttributesSchema.parse(input);

  const normalized: VisualAttributes = {
    species: normalizeText(parsed.species),
    primaryColor: normalizeText(parsed.primaryColor),
    furPattern: normalizeText(parsed.furPattern),
    confidence: parsed.confidence,
  };

  const secondaryColor = normalizeOptionalText(parsed.secondaryColor);
  if (secondaryColor) {
    normalized.secondaryColor = secondaryColor;
  }

  const estimatedBreed = normalizeOptionalText(parsed.estimatedBreed);
  if (estimatedBreed) {
    normalized.estimatedBreed = estimatedBreed;
  }

  return normalized;
}

export function normalizeHttpsImageUrl(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('Image URL must be a valid HTTPS URL.');
  }

  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || !url.hostname) {
      throw new Error('Image URL must be a valid HTTPS URL.');
    }

    return url.toString();
  } catch {
    throw new Error('Image URL must be a valid HTTPS URL.');
  }
}

export function parseOpenRouterMessageContent(content: unknown) {
  if (typeof content === 'string') {
    return JSON.parse(content);
  }

  if (content && typeof content === 'object') {
    return content;
  }

  throw new Error('OpenRouter response did not include JSON content.');
}

export async function analyzeImageWithOpenRouter(input: {
  apiKey: string;
  imageUrl: string;
}) {
  const imageUrl = normalizeHttpsImageUrl(input.imageUrl);

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
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
            {
              type: 'text',
              text:
                'Analyze this pet image. Return only JSON with species, primaryColor, secondaryColor, furPattern, estimatedBreed, confidence from 0 to 1.',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  return normalizeVisualAttributes(parseOpenRouterMessageContent(content));
}
