import { normalizeHttpsImageUrl, normalizeVisualAttributes, parseOpenRouterMessageContent } from '../openrouter';

it('normalizes Gemini visual JSON', () => {
  const result = normalizeVisualAttributes({
    species: ' Cat ',
    primaryColor: 'White',
    secondaryColor: 'Orange',
    furPattern: 'Bicolor',
    estimatedBreed: 'Domestic Shorthair',
    confidence: 0.8,
  });

  expect(result).toEqual({
    species: 'cat',
    primaryColor: 'white',
    secondaryColor: 'orange',
    furPattern: 'bicolor',
    estimatedBreed: 'domestic shorthair',
    confidence: 0.8,
  });
});

it('omits blank optional visual attributes', () => {
  const result = normalizeVisualAttributes({
    species: 'Dog',
    primaryColor: 'Black',
    secondaryColor: '   ',
    furPattern: 'Solid',
    estimatedBreed: '',
    confidence: 0.72,
  });

  expect(result).toEqual({
    species: 'dog',
    primaryColor: 'black',
    furPattern: 'solid',
    confidence: 0.72,
  });
});

it('parses JSON string content from OpenRouter responses', () => {
  const result = parseOpenRouterMessageContent(
    '{"species":"cat","primaryColor":"white","furPattern":"solid","confidence":0.91}',
  );

  expect(result).toEqual({
    species: 'cat',
    primaryColor: 'white',
    furPattern: 'solid',
    confidence: 0.91,
  });
});

it('passes through object content from OpenRouter responses', () => {
  const content = {
    species: 'dog',
    primaryColor: 'black',
    furPattern: 'solid',
    confidence: 0.7,
  };

  expect(parseOpenRouterMessageContent(content)).toBe(content);
});

it('normalizes valid HTTPS image URLs', () => {
  expect(normalizeHttpsImageUrl(' https://storage.googleapis.com/adoptpet/search/cat.jpg ')).toBe(
    'https://storage.googleapis.com/adoptpet/search/cat.jpg',
  );
});

it('rejects non-HTTPS image URLs', () => {
  expect(() => normalizeHttpsImageUrl('notaurl')).toThrow('valid HTTPS URL');
  expect(() => normalizeHttpsImageUrl('http://example.com/cat.jpg')).toThrow('valid HTTPS URL');
});
