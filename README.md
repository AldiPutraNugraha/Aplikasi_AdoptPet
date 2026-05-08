# AdoptPet

AdoptPet is a React Native and Expo Android application for pet adoption. It uses Firebase for online backend services, Google Maps for location features, and OpenRouter `google/gemini-2.5-flash` for image-based pet attribute recognition.

## Main Features

- Fixed user roles: Pelepas Hewan and Calon Pengadopsi
- Online authentication and user profile setup with full address and coordinates
- Pet posting with photos, health information, and proof uploads
- Manual pet search by species and primary color
- Visual pet search using OpenRouter Gemini model
- Distance sorting with the Haversine Formula
- Adoption screening form before request submission
- Owner approval or rejection workflow
- One-month post-adoption monitoring report
- Push token registration for adoption and monitoring reminders

## Online Services

- Firebase Authentication for owner and adopter accounts
- Cloud Firestore for users, pets, adoption requests, AI search logs, and monitoring reports
- Firebase Storage for pet photos, visual-search references, and monitoring report images
- Firebase Cloud Functions for OpenRouter access and scheduled monitoring jobs
- Google Maps for location display and coordinate-based distance features

## Environment

Copy `.env.example` to `.env` and fill in the Expo public Firebase and Google Maps keys:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

The OpenRouter API key must be configured as a Firebase Functions secret, not as a public mobile app environment variable.

## Development

```bash
npm install
npm run android
```

## Tests

```bash
npm test
npm run lint
npm run build --prefix functions
```

## Documentation

- Design spec: `docs/superpowers/specs/2026-05-07-adoptpet-online-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-07-adoptpet-online-mvp.md`
- Firebase deployment checklist: `docs/testing/firebase-deployment-checklist.md`
- Black Box Testing: `docs/testing/black-box-test-plan.md`
