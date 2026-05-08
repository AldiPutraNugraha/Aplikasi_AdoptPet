import { readFileSync } from 'fs';
import { join } from 'path';

it('binds the OpenRouter API key secret to the callable image analysis function', () => {
  const source = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8');

  expect(source).toContain("defineSecret('OPENROUTER_API_KEY')");
  expect(source).toContain('secrets: [openRouterApiKey]');
  expect(source).toContain('openRouterApiKey.value()');
});
