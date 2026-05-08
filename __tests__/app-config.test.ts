declare const process: {
  env: Record<string, string | undefined>;
};

it('injects the Google Maps API key into Android config', () => {
  const previousKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = 'maps-test-key';

  const configureApp = jest.requireActual('../app.config.js') as (input: { config: object }) => {
    android?: { config?: { googleMaps?: { apiKey?: string } } };
  };

  expect(configureApp({ config: {} }).android?.config?.googleMaps?.apiKey).toBe('maps-test-key');

  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = previousKey;
});
