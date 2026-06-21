import { getBreedsBySpecies, getVocabulary } from '@/lib/firebase/vocabularies';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'google/gemini-2.5-flash';

const UNKNOWN_LABEL = 'tidak tahu';

export type PetFormSuggestion = {
  species: string;
  estimatedBreed: string;
  primaryColor: string;
  secondaryColor: string;
  furPattern: string;
  confidence: number;
};

function normalize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function pickFromVocab(value: string, vocab: string[]): string {
  if (!value) return UNKNOWN_LABEL;
  const lower = value.toLowerCase();
  const match = vocab.find((opt) => opt.toLowerCase() === lower);
  return match ?? value;
}

async function fetchVocabularies() {
  const [species, primaryColors, secondaryColors, furPatterns] = await Promise.all([
    getVocabulary('species'),
    getVocabulary('primaryColors'),
    getVocabulary('secondaryColors'),
    getVocabulary('furPatterns'),
  ]);
  return { species, primaryColors, secondaryColors, furPatterns };
}

function vocabListText(label: string, items: string[]): string {
  if (!items.length) return `- ${label}: (kosong)`;
  return `- ${label}: ${items.join(', ')}`;
}

function buildInitialPrompt(vocabBlock: string): string {
  return [
    'Analyze this pet image and return ONLY a valid JSON object with these exact fields:',
    '{ "species": string, "estimatedBreed": string, "primaryColor": string, "secondaryColor": string, "furPattern": string, "confidence": number (0..1) }',
    '',
    'RULES:',
    '1. Use lowercase Indonesian terms.',
    `2. Prefer values from the known vocabulary below. If you cannot identify a value with confidence, return "${UNKNOWN_LABEL}".`,
    '3. Do not invent or hallucinate. "tidak tahu" is acceptable for any field.',
    '4. Return JSON only — no markdown, no commentary.',
    '',
    'Known vocabulary (from the adoption database):',
    vocabBlock,
  ].join('\n');
}

async function callOpenRouter(prompt: string, imageUrl: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OpenRouter API key belum dikonfigurasi di .env.');

  const response = await fetch(OPENROUTER_URL, {
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
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OpenRouter ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return JSON.parse(content) as Record<string, unknown>;
  if (content && typeof content === 'object') return content as Record<string, unknown>;
  throw new Error('Respons OpenRouter tidak berisi JSON.');
}

export async function analyzePetForForm(imageUrl: string): Promise<PetFormSuggestion> {
  console.log('[analyzePetForForm] start', { imageUrl: imageUrl.slice(0, 80) });

  const vocab = await fetchVocabularies();
  const vocabBlock = [
    vocabListText('species', vocab.species),
    vocabListText('primaryColor', vocab.primaryColors),
    vocabListText('secondaryColor', vocab.secondaryColors),
    vocabListText('furPattern', vocab.furPatterns),
  ].join('\n');

  const initial = await callOpenRouter(buildInitialPrompt(vocabBlock), imageUrl);
  console.log('[analyzePetForForm] initial', initial);

  const speciesRaw = normalize(initial.species);
  const species = speciesRaw && speciesRaw !== UNKNOWN_LABEL ? pickFromVocab(speciesRaw, vocab.species) : UNKNOWN_LABEL;

  // Stage 2: refine breed using species-specific vocabulary
  let estimatedBreed = normalize(initial.estimatedBreed) || UNKNOWN_LABEL;
  if (species !== UNKNOWN_LABEL) {
    const breeds = await getBreedsBySpecies(species).catch(() => [] as string[]);
    if (breeds.length > 0) {
      const breedPrompt = [
        `The pet was identified as: ${species}.`,
        'Look at the image again and choose the most likely breed from this list:',
        breeds.join(', '),
        '',
        `If none clearly match, return "${UNKNOWN_LABEL}".`,
        'Return ONLY JSON: { "estimatedBreed": string, "confidence": number (0..1) }',
      ].join('\n');

      try {
        const refined = await callOpenRouter(breedPrompt, imageUrl);
        console.log('[analyzePetForForm] breed refinement', refined);
        const refinedBreed = normalize(refined.estimatedBreed);
        if (refinedBreed) {
          estimatedBreed = refinedBreed === UNKNOWN_LABEL ? UNKNOWN_LABEL : pickFromVocab(refinedBreed, breeds);
        }
      } catch (error) {
        console.warn('[analyzePetForForm] breed refinement failed', error);
        // keep initial guess
        estimatedBreed = pickFromVocab(estimatedBreed, breeds);
      }
    }
  }

  const result: PetFormSuggestion = {
    species,
    estimatedBreed,
    primaryColor:
      normalize(initial.primaryColor) === UNKNOWN_LABEL || !initial.primaryColor
        ? UNKNOWN_LABEL
        : pickFromVocab(normalize(initial.primaryColor), vocab.primaryColors),
    secondaryColor:
      normalize(initial.secondaryColor) === UNKNOWN_LABEL || !initial.secondaryColor
        ? UNKNOWN_LABEL
        : pickFromVocab(normalize(initial.secondaryColor), vocab.secondaryColors),
    furPattern:
      normalize(initial.furPattern) === UNKNOWN_LABEL || !initial.furPattern
        ? UNKNOWN_LABEL
        : pickFromVocab(normalize(initial.furPattern), vocab.furPatterns),
    confidence:
      typeof initial.confidence === 'number' ? Math.max(0, Math.min(1, initial.confidence)) : 0,
  };

  console.log('[analyzePetForForm] result', result);
  return result;
}
