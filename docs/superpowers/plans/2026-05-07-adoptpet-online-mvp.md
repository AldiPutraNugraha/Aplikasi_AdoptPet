# AdoptPet Online MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AdoptPet online Android MVP with Firebase, Google Maps, OpenRouter Gemini image recognition, two fixed user roles, adoption screening, and one-month post-adoption monitoring.

**Architecture:** The Expo mobile app owns presentation, form state, client-side Firestore reads, image selection, and route guards. Firebase owns authentication, database, storage, push tokens, Cloud Functions, scheduled monitoring jobs, and the OpenRouter API boundary. Shared domain types and pure utilities keep matching, distance sorting, and status logic testable outside the UI.

**Tech Stack:** Expo Router, React Native, TypeScript, Firebase JS SDK, Firebase Cloud Functions, Firebase Admin SDK, Firebase Storage, Firebase Cloud Messaging, Expo Image Picker, Expo Location, Expo Notifications, React Native Maps, OpenRouter `google/gemini-2.5-flash`, Jest.

---

## Scope Notes

This is one MVP plan, but it is divided into vertical tasks that can be implemented and verified independently. The first working slice is auth + role routing. The second working slice is owner pet posting. The third working slice is adopter browse/search. The AI, map, adoption request, and monitoring flows build on those foundations.

The current repository is still the default Expo starter. The plan intentionally replaces starter screens in `app/(tabs)` with AdoptPet screens instead of preserving example content.

## File Structure

Create or modify these files:

- Modify: `package.json` - add scripts and dependencies for Firebase, Expo capabilities, maps, forms, and tests.
- Create: `.env.example` - list required public Expo and Firebase environment keys.
- Create: `firebase.json` - Firebase project configuration for functions, rules, and storage rules.
- Create: `firestore.rules` - Firestore role-based access rules.
- Create: `storage.rules` - Storage access rules for pet photos, health proof, search images, and monitoring reports.
- Create: `jest.config.js` - Jest test runner configuration.
- Create: `types/domain.ts` - shared app domain types and status unions.
- Create: `lib/domain/status.ts` - status transition helpers.
- Create: `lib/domain/distance.ts` - Haversine distance and distance sorting helpers.
- Create: `lib/domain/visual-match.ts` - visual attribute scoring for AI search results.
- Create: `lib/firebase/client.ts` - Firebase client initialization.
- Create: `lib/firebase/auth.ts` - auth and user profile operations.
- Create: `lib/firebase/storage.ts` - image upload helpers.
- Create: `lib/firebase/pets.ts` - pet create/list/detail operations.
- Create: `lib/firebase/adoption.ts` - adoption request operations.
- Create: `lib/firebase/reports.ts` - monitoring report operations.
- Create: `lib/firebase/notifications.ts` - FCM token registration and notification permission helpers.
- Create: `lib/location/geocoding.ts` - address and coordinate helpers.
- Create: `lib/ai/openrouter-client.ts` - mobile callable wrapper for `analyzePetImage`.
- Create: `contexts/auth-context.tsx` - auth state provider and route guard data.
- Modify: `app/_layout.tsx` - wrap app in auth provider and stack routes.
- Delete or replace: `app/(tabs)/index.tsx`, `app/(tabs)/explore.tsx`, `app/(tabs)/_layout.tsx` - starter screens are replaced by app-specific route groups.
- Create: `app/auth/login.tsx` - login screen.
- Create: `app/auth/register.tsx` - registration with fixed role selection.
- Create: `app/profile/setup.tsx` - complete profile, address, coordinates, phone.
- Create: `app/(owner)/_layout.tsx` - owner tabs.
- Create: `app/(owner)/index.tsx` - owner dashboard and pet list.
- Create: `app/(owner)/pets/new.tsx` - create pet post.
- Create: `app/(owner)/requests.tsx` - review adoption requests.
- Create: `app/(owner)/monitoring.tsx` - review monitoring status.
- Create: `app/(adopter)/_layout.tsx` - adopter tabs.
- Create: `app/(adopter)/index.tsx` - browse available pets.
- Create: `app/(adopter)/search.tsx` - manual and visual search screen.
- Create: `app/(adopter)/pets/[id].tsx` - pet detail and map.
- Create: `app/(adopter)/requests/[petId].tsx` - screening form.
- Create: `app/(adopter)/reports/[requestId].tsx` - one-month report form.
- Create: `components/forms/TextField.tsx` - shared text input.
- Create: `components/forms/SelectField.tsx` - shared select control.
- Create: `components/forms/PhotoPicker.tsx` - image picker.
- Create: `components/pets/PetCard.tsx` - pet list card.
- Create: `components/pets/PetHealthSummary.tsx` - health display.
- Create: `components/pets/PetMap.tsx` - map view with marker.
- Create: `functions/package.json` - Functions workspace dependencies and scripts.
- Create: `functions/tsconfig.json` - Functions TypeScript config.
- Create: `functions/src/index.ts` - exported functions.
- Create: `functions/src/openrouter.ts` - OpenRouter request and JSON validation.
- Create: `functions/src/monitoring.ts` - monitoring due and late helpers.
- Create: `functions/src/notifications.ts` - FCM helpers.
- Create: `__tests__/distance.test.ts` - Haversine tests.
- Create: `__tests__/visual-match.test.ts` - visual matching tests.
- Create: `functions/src/__tests__/openrouter.test.ts` - OpenRouter response normalizer tests.
- Create: `docs/testing/black-box-test-plan.md` - thesis-oriented Black Box Testing matrix.

---

### Task 1: Dependency And Test Setup

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `.env.example`

- [ ] **Step 1: Add dependency and script targets**

Run:

```bash
npx expo install expo-image-picker expo-location expo-notifications react-native-maps
npm install firebase zod
npm install -D jest jest-expo @types/jest
```

Expected: dependencies are added to `package.json` and `package-lock.json`.

- [ ] **Step 2: Modify `package.json` scripts**

Set the scripts object to include the existing Expo commands plus tests:

```json
{
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "test": "jest --runInBand",
    "test:watch": "jest --watch"
  }
}
```

- [ ] **Step 3: Create `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
```

- [ ] **Step 4: Create `.env.example`**

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

OpenRouter API key is intentionally not listed here because it belongs in Firebase Functions config or secrets, not the mobile app.

- [ ] **Step 5: Run verification**

Run:

```bash
npm test -- --passWithNoTests
npm run lint
```

Expected: Jest runs without tests and lint still passes after dependency setup.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json jest.config.js .env.example
git commit -m "chore: set up AdoptPet dependencies and tests"
```

---

### Task 2: Domain Types And Pure Utilities

**Files:**
- Create: `types/domain.ts`
- Create: `lib/domain/status.ts`
- Create: `lib/domain/distance.ts`
- Create: `lib/domain/visual-match.ts`
- Test: `__tests__/distance.test.ts`
- Test: `__tests__/visual-match.test.ts`

- [ ] **Step 1: Write failing Haversine tests**

Create `__tests__/distance.test.ts`:

```ts
import { calculateDistanceKm, sortByDistance } from '@/lib/domain/distance';
import type { Coordinates } from '@/types/domain';

describe('calculateDistanceKm', () => {
  it('returns 0 for the same coordinate', () => {
    const point: Coordinates = { latitude: -6.9175, longitude: 107.6191 };
    expect(calculateDistanceKm(point, point)).toBe(0);
  });

  it('calculates distance between Bandung and Jakarta', () => {
    const bandung: Coordinates = { latitude: -6.9175, longitude: 107.6191 };
    const jakarta: Coordinates = { latitude: -6.2088, longitude: 106.8456 };
    expect(calculateDistanceKm(bandung, jakarta)).toBeGreaterThan(110);
    expect(calculateDistanceKm(bandung, jakarta)).toBeLessThan(130);
  });
});

describe('sortByDistance', () => {
  it('sorts pets by nearest coordinate', () => {
    const origin: Coordinates = { latitude: -6.9175, longitude: 107.6191 };
    const result = sortByDistance(origin, [
      { id: 'jakarta', coordinates: { latitude: -6.2088, longitude: 106.8456 } },
      { id: 'cimahi', coordinates: { latitude: -6.8722, longitude: 107.5425 } },
    ]);

    expect(result.map((item) => item.id)).toEqual(['cimahi', 'jakarta']);
    expect(result[0].distanceKm).toBeLessThan(result[1].distanceKm);
  });
});
```

- [ ] **Step 2: Write failing visual match tests**

Create `__tests__/visual-match.test.ts`:

```ts
import { scorePetVisualMatch } from '@/lib/domain/visual-match';
import type { Pet, VisualAttributes } from '@/types/domain';

const pet: Pet = {
  id: 'pet-1',
  ownerId: 'owner-1',
  name: 'Milo',
  species: 'cat',
  estimatedBreed: 'domestic shorthair',
  primaryColor: 'white',
  secondaryColor: 'orange',
  furPattern: 'bicolor',
  age: '2 tahun',
  sex: 'male',
  description: 'Friendly cat',
  photoUrls: [],
  vaccinationStatus: 'vaccinated',
  sterilizationStatus: 'unknown',
  medicalHistory: '',
  healthProofUrls: [],
  fullAddress: 'Bandung',
  coordinates: { latitude: -6.9175, longitude: 107.6191 },
  status: 'available',
  createdAt: 0,
  updatedAt: 0,
};

it('scores exact visual matches higher than partial matches', () => {
  const exact: VisualAttributes = {
    species: 'cat',
    primaryColor: 'white',
    secondaryColor: 'orange',
    furPattern: 'bicolor',
    estimatedBreed: 'domestic shorthair',
    confidence: 0.8,
  };

  const partial: VisualAttributes = {
    species: 'cat',
    primaryColor: 'black',
    secondaryColor: 'white',
    furPattern: 'solid',
    estimatedBreed: 'persian',
    confidence: 0.8,
  };

  expect(scorePetVisualMatch(pet, exact)).toBeGreaterThan(scorePetVisualMatch(pet, partial));
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
npm test -- __tests__/distance.test.ts __tests__/visual-match.test.ts
```

Expected: FAIL because `types/domain.ts`, `lib/domain/distance.ts`, and `lib/domain/visual-match.ts` do not exist.

- [ ] **Step 4: Create `types/domain.ts`**

```ts
export type UserRole = 'owner' | 'adopter';

export type PetStatus =
  | 'available'
  | 'requested'
  | 'approved'
  | 'adopted'
  | 'monitoring_due'
  | 'monitoring_submitted'
  | 'monitoring_late';

export type AdoptionRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type MonitoringReportStatus = 'scheduled' | 'due' | 'submitted' | 'late';
export type HealthStatus = 'yes' | 'no' | 'unknown';
export type PetSex = 'male' | 'female' | 'unknown';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber: string;
  fullAddress: string;
  coordinates?: Coordinates;
  fcmToken?: string;
  createdAt: number;
  updatedAt: number;
};

export type VisualAttributes = {
  species: string;
  primaryColor: string;
  secondaryColor?: string;
  furPattern: string;
  estimatedBreed?: string;
  confidence: number;
};

export type Pet = {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  estimatedBreed?: string;
  primaryColor: string;
  secondaryColor?: string;
  furPattern: string;
  age: string;
  sex: PetSex;
  description: string;
  photoUrls: string[];
  vaccinationStatus: HealthStatus | 'vaccinated';
  sterilizationStatus: HealthStatus;
  medicalHistory: string;
  healthProofUrls: string[];
  fullAddress: string;
  coordinates?: Coordinates;
  status: PetStatus;
  aiAttributes?: VisualAttributes;
  createdAt: number;
  updatedAt: number;
};

export type AdoptionScreeningAnswers = {
  adoptionReason: string;
  petCareExperience: string;
  livingCondition: string;
  dailyCareAvailability: string;
  whatsappContact: string;
};

export type AdoptionRequest = {
  id: string;
  petId: string;
  ownerId: string;
  adopterId: string;
  screeningAnswers: AdoptionScreeningAnswers;
  status: AdoptionRequestStatus;
  ownerNote?: string;
  requestedAt: number;
  decidedAt?: number;
};

export type PostAdoptionReport = {
  id: string;
  requestId: string;
  petId: string;
  ownerId: string;
  adopterId: string;
  dueAt: number;
  status: MonitoringReportStatus;
  conditionPhotoUrls: string[];
  conditionNote?: string;
  submittedAt?: number;
  createdAt: number;
};
```

- [ ] **Step 5: Create `lib/domain/distance.ts`**

```ts
import type { Coordinates } from '@/types/domain';

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  if (from.latitude === to.latitude && from.longitude === to.longitude) {
    return 0;
  }

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

export function sortByDistance<T extends { coordinates?: Coordinates }>(
  origin: Coordinates,
  items: T[],
) {
  return items
    .filter((item): item is T & { coordinates: Coordinates } => Boolean(item.coordinates))
    .map((item) => ({
      ...item,
      distanceKm: calculateDistanceKm(origin, item.coordinates),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
```

- [ ] **Step 6: Create `lib/domain/visual-match.ts`**

```ts
import type { Pet, VisualAttributes } from '@/types/domain';

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

function includesEither(a?: string, b?: string) {
  const left = normalize(a);
  const right = normalize(b);

  if (!left || !right) {
    return false;
  }

  return left.includes(right) || right.includes(left);
}

export function scorePetVisualMatch(pet: Pet, visual: VisualAttributes) {
  let score = 0;

  if (includesEither(pet.species, visual.species)) score += 40;
  if (includesEither(pet.primaryColor, visual.primaryColor)) score += 24;
  if (includesEither(pet.secondaryColor, visual.secondaryColor)) score += 10;
  if (includesEither(pet.furPattern, visual.furPattern)) score += 16;
  if (includesEither(pet.estimatedBreed, visual.estimatedBreed)) score += 10;

  return Math.round(score * Math.max(0.2, visual.confidence));
}

export function sortPetsByVisualMatch(pets: Pet[], visual: VisualAttributes) {
  return pets
    .map((pet) => ({
      ...pet,
      visualScore: scorePetVisualMatch(pet, visual),
    }))
    .sort((a, b) => b.visualScore - a.visualScore);
}
```

- [ ] **Step 7: Create `lib/domain/status.ts`**

```ts
import type { AdoptionRequestStatus, MonitoringReportStatus, PetStatus } from '@/types/domain';

export function petStatusAfterRequest(): PetStatus {
  return 'requested';
}

export function petStatusAfterApproval(): PetStatus {
  return 'adopted';
}

export function petStatusAfterMonitoring(status: MonitoringReportStatus): PetStatus {
  if (status === 'submitted') return 'monitoring_submitted';
  if (status === 'late') return 'monitoring_late';
  return 'monitoring_due';
}

export function canOwnerDecideRequest(status: AdoptionRequestStatus) {
  return status === 'pending';
}
```

- [ ] **Step 8: Run tests and verify pass**

Run:

```bash
npm test -- __tests__/distance.test.ts __tests__/visual-match.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add types/domain.ts lib/domain/status.ts lib/domain/distance.ts lib/domain/visual-match.ts __tests__/distance.test.ts __tests__/visual-match.test.ts
git commit -m "feat: add AdoptPet domain utilities"
```

---

### Task 3: Firebase Project Configuration And Client Layer

**Files:**
- Create: `firebase.json`
- Create: `firestore.rules`
- Create: `storage.rules`
- Create: `lib/firebase/client.ts`
- Create: `lib/firebase/auth.ts`
- Create: `lib/firebase/storage.ts`
- Create: `lib/firebase/pets.ts`
- Create: `lib/firebase/adoption.ts`
- Create: `lib/firebase/reports.ts`
- Create: `lib/firebase/notifications.ts`

- [ ] **Step 1: Create `firebase.json`**

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log"]
    }
  ]
}
```

- [ ] **Step 2: Create permissive development rules with auth guards**

Create `firestore.rules`:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isSelf(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    function isOwner() {
      return signedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }

    function isAdopter() {
      return signedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'adopter';
    }

    match /users/{userId} {
      allow create: if isSelf(userId);
      allow read, update: if isSelf(userId);
    }

    match /pets/{petId} {
      allow read: if signedIn();
      allow create: if isOwner() && request.resource.data.ownerId == request.auth.uid;
      allow update: if isOwner() && resource.data.ownerId == request.auth.uid;
    }

    match /adoptionRequests/{requestId} {
      allow read: if signedIn()
        && (resource.data.ownerId == request.auth.uid || resource.data.adopterId == request.auth.uid);
      allow create: if isAdopter() && request.resource.data.adopterId == request.auth.uid;
      allow update: if signedIn()
        && (resource.data.ownerId == request.auth.uid || resource.data.adopterId == request.auth.uid);
    }

    match /postAdoptionReports/{reportId} {
      allow read: if signedIn()
        && (resource.data.ownerId == request.auth.uid || resource.data.adopterId == request.auth.uid);
      allow create, update: if signedIn()
        && request.resource.data.adopterId == request.auth.uid;
    }

    match /aiSearchLogs/{logId} {
      allow read: if signedIn() && resource.data.userId == request.auth.uid;
      allow write: if false;
    }
  }
}
```

Create `storage.rules`:

```js
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function signedIn() {
      return request.auth != null;
    }

    match /users/{userId}/{allPaths=**} {
      allow read, write: if signedIn() && request.auth.uid == userId;
    }

    match /pets/{ownerId}/{allPaths=**} {
      allow read: if signedIn();
      allow write: if signedIn() && request.auth.uid == ownerId;
    }

    match /reports/{adopterId}/{allPaths=**} {
      allow read, write: if signedIn() && request.auth.uid == adopterId;
    }

    match /search/{userId}/{allPaths=**} {
      allow read, write: if signedIn() && request.auth.uid == userId;
    }
  }
}
```

- [ ] **Step 3: Create `lib/firebase/client.ts`**

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp, 'asia-southeast2');
```

- [ ] **Step 4: Create `lib/firebase/auth.ts`**

```ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { firebaseAuth, firestore } from '@/lib/firebase/client';
import type { AppUser, Coordinates, UserRole } from '@/types/domain';

export async function registerWithRole(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}) {
  const credential = await createUserWithEmailAndPassword(firebaseAuth, input.email, input.password);
  const now = Date.now();

  const profile: AppUser = {
    id: credential.user.uid,
    name: input.name,
    email: input.email,
    role: input.role,
    phoneNumber: '',
    fullAddress: '',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(firestore, 'users', credential.user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export function login(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export function logout() {
  return signOut(firebaseAuth);
}

export async function getUserProfile(userId: string) {
  const snapshot = await getDoc(doc(firestore, 'users', userId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as AppUser) : null;
}

export function updateProfileDetails(
  userId: string,
  input: { phoneNumber: string; fullAddress: string; coordinates?: Coordinates },
) {
  return updateDoc(doc(firestore, 'users', userId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}
```

- [ ] **Step 5: Create `lib/firebase/storage.ts`**

```ts
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/lib/firebase/client';

export async function uploadImageAsync(uri: string, path: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = ref(storage, path);

  await uploadBytes(imageRef, blob);
  return getDownloadURL(imageRef);
}
```

- [ ] **Step 6: Create Firestore service modules**

Create `lib/firebase/pets.ts`:

```ts
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';
import type { Pet } from '@/types/domain';

export async function createPet(input: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(firestore, 'pets'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listAvailablePets() {
  const snapshot = await getDocs(query(collection(firestore, 'pets'), where('status', '==', 'available')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Pet);
}

export async function listOwnerPets(ownerId: string) {
  const snapshot = await getDocs(query(collection(firestore, 'pets'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Pet);
}

export async function getPetById(id: string) {
  const snapshot = await getDoc(doc(firestore, 'pets', id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Pet) : null;
}
```

Create `lib/firebase/adoption.ts`:

```ts
import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, where, doc } from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';
import type { AdoptionRequest, AdoptionScreeningAnswers } from '@/types/domain';

export function submitAdoptionRequest(input: {
  petId: string;
  ownerId: string;
  adopterId: string;
  screeningAnswers: AdoptionScreeningAnswers;
}) {
  return addDoc(collection(firestore, 'adoptionRequests'), {
    ...input,
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
}

export async function listOwnerRequests(ownerId: string) {
  const snapshot = await getDocs(query(collection(firestore, 'adoptionRequests'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AdoptionRequest);
}

export function updateRequestDecision(requestId: string, status: 'accepted' | 'rejected', ownerNote: string) {
  return updateDoc(doc(firestore, 'adoptionRequests', requestId), {
    status,
    ownerNote,
    decidedAt: serverTimestamp(),
  });
}
```

Create `lib/firebase/reports.ts`:

```ts
import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, where, doc } from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';
import type { PostAdoptionReport } from '@/types/domain';

export async function listReportsForAdopter(adopterId: string) {
  const snapshot = await getDocs(query(collection(firestore, 'postAdoptionReports'), where('adopterId', '==', adopterId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PostAdoptionReport);
}

export async function listReportsForOwner(ownerId: string) {
  const snapshot = await getDocs(query(collection(firestore, 'postAdoptionReports'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PostAdoptionReport);
}

export function submitMonitoringReport(reportId: string, input: { conditionPhotoUrls: string[]; conditionNote: string }) {
  return updateDoc(doc(firestore, 'postAdoptionReports', reportId), {
    ...input,
    status: 'submitted',
    submittedAt: serverTimestamp(),
  });
}
```

Create `lib/firebase/notifications.ts`:

```ts
import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { firestore } from '@/lib/firebase/client';

export async function registerPushToken(userId: string) {
  const permission = await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  await updateDoc(doc(firestore, 'users', userId), {
    fcmToken: token.data,
    updatedAt: serverTimestamp(),
  });

  return token.data;
}
```

- [ ] **Step 7: Run verification**

Run:

```bash
npm run lint
npm test -- __tests__/distance.test.ts __tests__/visual-match.test.ts
```

Expected: lint passes and domain tests still pass.

- [ ] **Step 8: Commit**

```bash
git add firebase.json firestore.rules storage.rules lib/firebase
git commit -m "feat: add Firebase client and rules foundation"
```

---

### Task 4: Auth Context And Role-Based Routes

**Files:**
- Create: `contexts/auth-context.tsx`
- Modify: `app/_layout.tsx`
- Create: `app/auth/login.tsx`
- Create: `app/auth/register.tsx`
- Create: `app/profile/setup.tsx`
- Create: `components/forms/TextField.tsx`
- Create: `components/forms/SelectField.tsx`

- [ ] **Step 1: Create shared form fields**

Create `components/forms/TextField.tsx`:

```tsx
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, style]} placeholderTextColor="#6b7280" {...props} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { color: '#1f2937', fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  error: { color: '#b91c1c', fontSize: 12 },
});
```

Create `components/forms/SelectField.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Option<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function SelectField<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: '#1f2937', fontSize: 14, fontWeight: '600' },
  options: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  option: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  optionSelected: { borderColor: '#0f766e', backgroundColor: '#ccfbf1' },
  optionText: { color: '#374151', fontWeight: '600' },
  optionTextSelected: { color: '#0f766e' },
});
```

- [ ] **Step 2: Create auth context**

Create `contexts/auth-context.tsx`:

```tsx
import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { firebaseAuth } from '@/lib/firebase/client';
import { getUserProfile } from '@/lib/firebase/auth';
import type { AppUser } from '@/types/domain';

type AuthContextValue = {
  firebaseUser: User | null;
  profile: AppUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    if (!firebaseAuth.currentUser) {
      setProfile(null);
      return;
    }

    const nextProfile = await getUserProfile(firebaseAuth.currentUser.uid);
    setProfile(nextProfile);
  }

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);
      setLoading(true);
      setProfile(user ? await getUserProfile(user.uid) : null);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, loading, refreshProfile }),
    [firebaseUser, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
```

- [ ] **Step 3: Modify `app/_layout.tsx`**

Replace the file with:

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="profile/setup" options={{ title: 'Lengkapi Profil' }} />
        <Stack.Screen name="(owner)" options={{ headerShown: false }} />
        <Stack.Screen name="(adopter)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Create login and register screens**

Create `app/auth/login.tsx`:

```tsx
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { login } from '@/lib/firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (error) {
      Alert.alert('Login gagal', error instanceof Error ? error.message : 'Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>AdoptPet</Text>
      <Text style={styles.subtitle}>Masuk untuk melanjutkan proses adopsi.</Text>
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Memproses...' : 'Masuk'}</Text>
      </Pressable>
      <Link href="/auth/register" style={styles.link}>Belum punya akun? Daftar</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: 16, padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 34, fontWeight: '800', color: '#0f766e' },
  subtitle: { fontSize: 16, color: '#475569' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
  link: { color: '#0f766e', fontWeight: '700', textAlign: 'center' },
});
```

Create `app/auth/register.tsx`:

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { registerWithRole } from '@/lib/firebase/auth';
import type { UserRole } from '@/types/domain';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('adopter');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await registerWithRole({ name: name.trim(), email: email.trim(), password, role });
      router.replace('/profile/setup');
    } catch (error) {
      Alert.alert('Registrasi gagal', error instanceof Error ? error.message : 'Periksa data registrasi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Buat Akun</Text>
      <TextField label="Nama lengkap" value={name} onChangeText={setName} />
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <SelectField
        label="Pilih role"
        value={role}
        onChange={setRole}
        options={[
          { label: 'Calon Pengadopsi', value: 'adopter' },
          { label: 'Pelepas Hewan', value: 'owner' },
        ]}
      />
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Memproses...' : 'Daftar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: 16, padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 30, fontWeight: '800', color: '#0f766e' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
});
```

- [ ] **Step 5: Create profile setup screen**

Create `app/profile/setup.tsx`:

```tsx
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import { updateProfileDetails } from '@/lib/firebase/auth';
import type { Coordinates } from '@/types/domain';

export default function ProfileSetupScreen() {
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? '');
  const [fullAddress, setFullAddress] = useState(profile?.fullAddress ?? '');
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(profile?.coordinates);

  async function useCurrentLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Lokasi ditolak', 'Alamat tetap bisa diisi manual.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    setCoordinates({
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    });
  }

  async function onSubmit() {
    if (!firebaseUser || !profile) return;

    await updateProfileDetails(firebaseUser.uid, { phoneNumber, fullAddress, coordinates });
    await refreshProfile();
    router.replace(profile.role === 'owner' ? '/(owner)' : '/(adopter)');
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Lengkapi Profil</Text>
      <TextField label="Nomor WhatsApp" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
      <TextField label="Alamat lengkap" value={fullAddress} onChangeText={setFullAddress} multiline />
      <Pressable style={styles.secondaryButton} onPress={useCurrentLocation}>
        <Text style={styles.secondaryButtonText}>
          {coordinates ? 'Koordinat tersimpan' : 'Ambil Lokasi Saat Ini'}
        </Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Simpan Profil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 16, padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f766e' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
  secondaryButton: { alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#0f766e', paddingVertical: 14 },
  secondaryButtonText: { color: '#0f766e', fontWeight: '700' },
});
```

- [ ] **Step 6: Run verification**

Run:

```bash
npm run lint
```

Expected: lint passes.

- [ ] **Step 7: Commit**

```bash
git add app/_layout.tsx app/auth app/profile components/forms contexts/auth-context.tsx
git commit -m "feat: add authentication and role setup screens"
```

---

### Task 5: Owner Pet Posting Flow

**Files:**
- Create: `components/forms/PhotoPicker.tsx`
- Create: `app/(owner)/_layout.tsx`
- Create: `app/(owner)/index.tsx`
- Create: `app/(owner)/pets/new.tsx`
- Modify: `lib/firebase/pets.ts`

- [ ] **Step 1: Create `components/forms/PhotoPicker.tsx`**

```tsx
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  uris: string[];
  onChange: (uris: string[]) => void;
};

export function PhotoPicker({ label, uris, onChange }: Props) {
  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      onChange([...uris, ...result.assets.map((asset) => asset.uri)]);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Pilih Foto</Text>
      </Pressable>
      <ScrollView horizontal contentContainerStyle={styles.previewList}>
        {uris.map((uri) => (
          <Image key={uri} source={{ uri }} style={styles.preview} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: '#1f2937', fontSize: 14, fontWeight: '600' },
  button: { alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#0f766e', paddingVertical: 12 },
  buttonText: { color: '#0f766e', fontWeight: '700' },
  previewList: { gap: 8 },
  preview: { width: 92, height: 92, borderRadius: 8, backgroundColor: '#e5e7eb' },
});
```

- [ ] **Step 2: Create owner tabs**

Create `app/(owner)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center', tabBarActiveTintColor: '#0f766e' }}>
      <Tabs.Screen name="index" options={{ title: 'Hewan' }} />
      <Tabs.Screen name="pets/new" options={{ title: 'Tambah', href: null }} />
      <Tabs.Screen name="requests" options={{ title: 'Pengajuan' }} />
      <Tabs.Screen name="monitoring" options={{ title: 'Monitoring' }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Create owner dashboard**

Create `app/(owner)/index.tsx`:

```tsx
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { listOwnerPets } from '@/lib/firebase/pets';
import type { Pet } from '@/types/domain';

export default function OwnerHomeScreen() {
  const { firebaseUser } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    listOwnerPets(firebaseUser.uid).then(setPets);
  }, [firebaseUser]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Posting Hewan</Text>
        <Link href="/(owner)/pets/new" asChild>
          <Pressable style={styles.button}><Text style={styles.buttonText}>Tambah</Text></Pressable>
        </Link>
      </View>
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.petName}>{item.name}</Text>
            <Text style={styles.petMeta}>{item.species} - {item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada posting hewan.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  button: { borderRadius: 8, backgroundColor: '#0f766e', paddingHorizontal: 14, paddingVertical: 10 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
  card: { borderRadius: 8, backgroundColor: '#ffffff', padding: 14, marginBottom: 10 },
  petName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  petMeta: { color: '#64748b', marginTop: 4 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 32 },
});
```

- [ ] **Step 4: Create pet creation screen**

Create `app/(owner)/pets/new.tsx`:

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import { createPet } from '@/lib/firebase/pets';
import { uploadImageAsync } from '@/lib/firebase/storage';
import type { HealthStatus, PetSex } from '@/types/domain';

export default function NewPetScreen() {
  const { firebaseUser, profile } = useAuth();
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [healthProofUris, setHealthProofUris] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('cat');
  const [estimatedBreed, setEstimatedBreed] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [furPattern, setFurPattern] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<PetSex>('unknown');
  const [vaccinationStatus, setVaccinationStatus] = useState<HealthStatus>('unknown');
  const [sterilizationStatus, setSterilizationStatus] = useState<HealthStatus>('unknown');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    if (!firebaseUser || !profile) return;
    setSaving(true);

    try {
      const photoUrls = await Promise.all(
        photoUris.map((uri, index) => uploadImageAsync(uri, `pets/${firebaseUser.uid}/${Date.now()}-${index}.jpg`)),
      );
      const healthProofUrls = await Promise.all(
        healthProofUris.map((uri, index) => uploadImageAsync(uri, `pets/${firebaseUser.uid}/health-${Date.now()}-${index}.jpg`)),
      );

      await createPet({
        ownerId: firebaseUser.uid,
        name,
        species,
        estimatedBreed,
        primaryColor,
        secondaryColor,
        furPattern,
        age,
        sex,
        description,
        photoUrls,
        vaccinationStatus,
        sterilizationStatus,
        medicalHistory,
        healthProofUrls,
        fullAddress: profile.fullAddress,
        coordinates: profile.coordinates,
        status: 'available',
      });

      router.replace('/(owner)');
    } catch (error) {
      Alert.alert('Gagal menyimpan', error instanceof Error ? error.message : 'Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tambah Hewan</Text>
      <PhotoPicker label="Foto hewan" uris={photoUris} onChange={setPhotoUris} />
      <TextField label="Nama hewan" value={name} onChangeText={setName} />
      <TextField label="Jenis" value={species} onChangeText={setSpecies} />
      <TextField label="Ras/perkiraan ras" value={estimatedBreed} onChangeText={setEstimatedBreed} />
      <TextField label="Warna utama" value={primaryColor} onChangeText={setPrimaryColor} />
      <TextField label="Warna sekunder" value={secondaryColor} onChangeText={setSecondaryColor} />
      <TextField label="Corak bulu" value={furPattern} onChangeText={setFurPattern} />
      <TextField label="Usia" value={age} onChangeText={setAge} />
      <SelectField label="Jenis kelamin" value={sex} onChange={setSex} options={[
        { label: 'Jantan', value: 'male' },
        { label: 'Betina', value: 'female' },
        { label: 'Tidak tahu', value: 'unknown' },
      ]} />
      <SelectField label="Status vaksin" value={vaccinationStatus} onChange={setVaccinationStatus} options={[
        { label: 'Ya', value: 'yes' },
        { label: 'Tidak', value: 'no' },
        { label: 'Tidak tahu', value: 'unknown' },
      ]} />
      <SelectField label="Status sterilisasi" value={sterilizationStatus} onChange={setSterilizationStatus} options={[
        { label: 'Ya', value: 'yes' },
        { label: 'Tidak', value: 'no' },
        { label: 'Tidak tahu', value: 'unknown' },
      ]} />
      <TextField label="Riwayat kesehatan" value={medicalHistory} onChangeText={setMedicalHistory} multiline />
      <PhotoPicker label="Bukti kesehatan opsional" uris={healthProofUris} onChange={setHealthProofUris} />
      <TextField label="Deskripsi" value={description} onChangeText={setDescription} multiline />
      <Pressable style={styles.button} onPress={onSubmit} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Menyimpan...' : 'Simpan Hewan'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
});
```

- [ ] **Step 5: Run verification**

Run:

```bash
npm run lint
```

Expected: lint passes.

- [ ] **Step 6: Commit**

```bash
git add app/'(owner)' components/forms/PhotoPicker.tsx lib/firebase/pets.ts
git commit -m "feat: add owner pet posting flow"
```

---

### Task 6: Adopter Browse, Manual Search, And Pet Detail

**Files:**
- Create: `components/pets/PetCard.tsx`
- Create: `components/pets/PetHealthSummary.tsx`
- Create: `components/pets/PetMap.tsx`
- Create: `app/(adopter)/_layout.tsx`
- Create: `app/(adopter)/index.tsx`
- Create: `app/(adopter)/search.tsx`
- Create: `app/(adopter)/pets/[id].tsx`

- [ ] **Step 1: Create pet card and health summary**

Create `components/pets/PetCard.tsx`:

```tsx
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { Pet } from '@/types/domain';

type Props = {
  pet: Pet & { distanceKm?: number; visualScore?: number };
};

export function PetCard({ pet }: Props) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: pet.photoUrls[0] }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.meta}>{pet.species} - {pet.primaryColor} - {pet.furPattern}</Text>
        {typeof pet.distanceKm === 'number' ? <Text style={styles.detail}>{pet.distanceKm} km dari lokasi Anda</Text> : null}
        {typeof pet.visualScore === 'number' ? <Text style={styles.detail}>Skor kemiripan {pet.visualScore}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, borderRadius: 8, backgroundColor: '#ffffff', padding: 12, marginBottom: 10 },
  image: { width: 84, height: 84, borderRadius: 8, backgroundColor: '#e5e7eb' },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '800', color: '#111827' },
  meta: { color: '#475569' },
  detail: { color: '#0f766e', fontWeight: '600' },
});
```

Create `components/pets/PetHealthSummary.tsx`:

```tsx
import { StyleSheet, Text, View } from 'react-native';

import type { Pet } from '@/types/domain';

export function PetHealthSummary({ pet }: { pet: Pet }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Informasi Kesehatan</Text>
      <Text>Status vaksin: {pet.vaccinationStatus}</Text>
      <Text>Status sterilisasi: {pet.sterilizationStatus}</Text>
      <Text>Riwayat: {pet.medicalHistory || 'Tidak ada catatan'}</Text>
      <Text>Bukti kesehatan: {pet.healthProofUrls.length} file</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6, borderRadius: 8, backgroundColor: '#ffffff', padding: 14 },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
});
```

- [ ] **Step 2: Create map component**

Create `components/pets/PetMap.tsx`:

```tsx
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

import type { Coordinates } from '@/types/domain';

type Props = {
  coordinates?: Coordinates;
  title: string;
};

export function PetMap({ coordinates, title }: Props) {
  if (!coordinates) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Lokasi belum tersedia.</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}>
      <Marker coordinate={coordinates} title={title} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: 220, borderRadius: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', height: 160, borderRadius: 8, backgroundColor: '#e5e7eb' },
  emptyText: { color: '#64748b' },
});
```

- [ ] **Step 3: Create adopter tabs**

Create `app/(adopter)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';

export default function AdopterLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center', tabBarActiveTintColor: '#0f766e' }}>
      <Tabs.Screen name="index" options={{ title: 'Cari Hewan' }} />
      <Tabs.Screen name="search" options={{ title: 'Pencarian' }} />
      <Tabs.Screen name="pets/[id]" options={{ href: null, title: 'Detail Hewan' }} />
      <Tabs.Screen name="requests/[petId]" options={{ href: null, title: 'Form Adopsi' }} />
      <Tabs.Screen name="reports/[requestId]" options={{ href: null, title: 'Laporan' }} />
    </Tabs>
  );
}
```

- [ ] **Step 4: Create browse and search screens**

Create `app/(adopter)/index.tsx`:

```tsx
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PetCard } from '@/components/pets/PetCard';
import { listAvailablePets } from '@/lib/firebase/pets';
import type { Pet } from '@/types/domain';

export default function AdopterHomeScreen() {
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    listAvailablePets().then(setPets);
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Hewan Tersedia</Text>
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/(adopter)/pets/${item.id}`} asChild>
            <Pressable><PetCard pet={item} /></Pressable>
          </Link>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada hewan tersedia.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 32 },
});
```

Create `app/(adopter)/search.tsx`:

```tsx
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { PetCard } from '@/components/pets/PetCard';
import { sortByDistance } from '@/lib/domain/distance';
import { listAvailablePets } from '@/lib/firebase/pets';
import type { Coordinates, Pet } from '@/types/domain';

export default function SearchScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [species, setSpecies] = useState('');
  const [color, setColor] = useState('');
  const [origin, setOrigin] = useState<Coordinates | undefined>();

  useEffect(() => {
    listAvailablePets().then(setPets);
    Location.requestForegroundPermissionsAsync().then(async (permission) => {
      if (!permission.granted) return;
      const current = await Location.getCurrentPositionAsync({});
      setOrigin({ latitude: current.coords.latitude, longitude: current.coords.longitude });
    });
  }, []);

  const filteredPets = useMemo(() => {
    const filtered = pets.filter((pet) => {
      const speciesMatch = species ? pet.species.toLowerCase().includes(species.toLowerCase()) : true;
      const colorMatch = color ? pet.primaryColor.toLowerCase().includes(color.toLowerCase()) : true;
      return speciesMatch && colorMatch;
    });

    return origin ? sortByDistance(origin, filtered) : filtered;
  }, [pets, species, color, origin]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Pencarian Manual</Text>
      <TextField label="Jenis hewan" value={species} onChangeText={setSpecies} />
      <TextField label="Warna utama" value={color} onChangeText={setColor} />
      <FlatList
        data={filteredPets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PetCard pet={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 12, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
});
```

- [ ] **Step 5: Create pet detail screen**

Create `app/(adopter)/pets/[id].tsx`:

```tsx
import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { PetHealthSummary } from '@/components/pets/PetHealthSummary';
import { PetMap } from '@/components/pets/PetMap';
import { getPetById } from '@/lib/firebase/pets';
import type { Pet } from '@/types/domain';

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);

  useEffect(() => {
    if (id) getPetById(id).then(setPet);
  }, [id]);

  if (!pet) return <Text style={styles.loading}>Memuat detail...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Image source={{ uri: pet.photoUrls[0] }} style={styles.hero} />
      <Text style={styles.title}>{pet.name}</Text>
      <Text style={styles.meta}>{pet.species} - {pet.estimatedBreed || 'Ras tidak diketahui'}</Text>
      <Text>{pet.description}</Text>
      <PetHealthSummary pet={pet} />
      <PetMap coordinates={pet.coordinates} title={pet.name} />
      <Text style={styles.address}>{pet.fullAddress}</Text>
      <Link href={`/(adopter)/requests/${pet.id}`} asChild>
        <Pressable style={styles.button}><Text style={styles.buttonText}>Ajukan Adopsi</Text></Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { margin: 24 },
  content: { gap: 14, padding: 16, backgroundColor: '#f8fafc' },
  hero: { width: '100%', height: 260, borderRadius: 8, backgroundColor: '#e5e7eb' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  meta: { color: '#475569', fontWeight: '600' },
  address: { color: '#475569' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
});
```

- [ ] **Step 6: Run verification**

Run:

```bash
npm run lint
npm test -- __tests__/distance.test.ts
```

Expected: lint and tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/'(adopter)' components/pets
git commit -m "feat: add adopter browse and search screens"
```

---

### Task 7: Firebase Functions And OpenRouter Image Recognition

**Files:**
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`
- Create: `functions/src/openrouter.ts`
- Create: `functions/src/index.ts`
- Test: `functions/src/__tests__/openrouter.test.ts`
- Create: `lib/ai/openrouter-client.ts`
- Modify: `app/(adopter)/search.tsx`

- [ ] **Step 1: Create Functions workspace files**

Create `functions/package.json`:

```json
{
  "name": "adoptpet-functions",
  "private": true,
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest --runInBand",
    "deploy": "firebase deploy --only functions"
  },
  "dependencies": {
    "firebase-admin": "^13.0.0",
    "firebase-functions": "^6.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.9.2"
  }
}
```

Create `functions/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2020"
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

- [ ] **Step 2: Write failing OpenRouter normalizer test**

Create `functions/src/__tests__/openrouter.test.ts`:

```ts
import { normalizeVisualAttributes } from '../openrouter';

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
```

- [ ] **Step 3: Implement `functions/src/openrouter.ts`**

```ts
import { z } from 'zod';

const VisualAttributesSchema = z.object({
  species: z.string().min(1),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().optional().default(''),
  furPattern: z.string().min(1),
  estimatedBreed: z.string().optional().default(''),
  confidence: z.number().min(0).max(1),
});

export type VisualAttributes = z.infer<typeof VisualAttributesSchema>;

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeVisualAttributes(input: unknown): VisualAttributes {
  const parsed = VisualAttributesSchema.parse(input);

  return {
    species: normalizeText(parsed.species),
    primaryColor: normalizeText(parsed.primaryColor),
    secondaryColor: normalizeText(parsed.secondaryColor),
    furPattern: normalizeText(parsed.furPattern),
    estimatedBreed: normalizeText(parsed.estimatedBreed),
    confidence: parsed.confidence,
  };
}

export async function analyzeImageWithOpenRouter(input: {
  apiKey: string;
  imageUrl: string;
}) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://adoptpet.local',
      'X-Title': 'AdoptPet Skripsi',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
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
              image_url: { url: input.imageUrl },
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
  const parsed = typeof content === 'string' ? JSON.parse(content) : content;

  return normalizeVisualAttributes(parsed);
}
```

- [ ] **Step 4: Implement callable function in `functions/src/index.ts`**

```ts
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { analyzeImageWithOpenRouter } from './openrouter';

admin.initializeApp();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export const analyzePetImage = onCall({ region: 'asia-southeast2' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login diperlukan.');
  }

  const imageUrl = request.data?.imageUrl;
  if (typeof imageUrl !== 'string' || imageUrl.length < 10) {
    throw new HttpsError('invalid-argument', 'imageUrl wajib dikirim.');
  }

  if (!OPENROUTER_API_KEY) {
    throw new HttpsError('failed-precondition', 'OpenRouter API key belum dikonfigurasi.');
  }

  try {
    const result = await analyzeImageWithOpenRouter({ apiKey: OPENROUTER_API_KEY, imageUrl });

    await admin.firestore().collection('aiSearchLogs').add({
      userId: request.auth.uid,
      model: 'google/gemini-2.5-flash',
      inputImagePath: imageUrl,
      resultJson: result,
      confidence: result.confidence,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return result;
  } catch (error) {
    await admin.firestore().collection('aiSearchLogs').add({
      userId: request.auth.uid,
      model: 'google/gemini-2.5-flash',
      inputImagePath: imageUrl,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw new HttpsError('internal', 'Analisis gambar gagal. Gunakan filter manual atau coba foto lain.');
  }
});
```

- [ ] **Step 5: Create mobile callable wrapper**

Create `lib/ai/openrouter-client.ts`:

```ts
import { httpsCallable } from 'firebase/functions';

import { functions } from '@/lib/firebase/client';
import type { VisualAttributes } from '@/types/domain';

export async function analyzePetImage(imageUrl: string) {
  const callable = httpsCallable<{ imageUrl: string }, VisualAttributes>(functions, 'analyzePetImage');
  const result = await callable({ imageUrl });
  return result.data;
}
```

- [ ] **Step 6: Extend search screen with visual search**

In `app/(adopter)/search.tsx`, add `PhotoPicker`, `uploadImageAsync`, `analyzePetImage`, and `sortPetsByVisualMatch`. The core submit function should be:

```ts
async function runVisualSearch() {
  if (!firebaseUser || imageUris.length === 0) return;
  setAiLoading(true);

  try {
    const imageUrl = await uploadImageAsync(imageUris[0], `search/${firebaseUser.uid}/${Date.now()}.jpg`);
    const attributes = await analyzePetImage(imageUrl);
    setVisualAttributes(attributes);
    setVisualResults(sortPetsByVisualMatch(pets, attributes));
  } catch (error) {
    Alert.alert('Pencarian visual gagal', error instanceof Error ? error.message : 'Gunakan pencarian manual.');
  } finally {
    setAiLoading(false);
  }
}
```

The screen should render:

```tsx
<PhotoPicker label="Foto referensi" uris={imageUris} onChange={setImageUris} />
<Pressable style={styles.button} onPress={runVisualSearch} disabled={aiLoading}>
  <Text style={styles.buttonText}>{aiLoading ? 'Menganalisis...' : 'Cari dari Gambar'}</Text>
</Pressable>
{visualAttributes ? (
  <Text style={styles.aiText}>
    Perkiraan: {visualAttributes.species}, {visualAttributes.primaryColor}, {visualAttributes.furPattern}
  </Text>
) : null}
```

- [ ] **Step 7: Run verification**

Run:

```bash
npm install --prefix functions
npm test --prefix functions
npm run build --prefix functions
npm run lint
```

Expected: function tests pass, Functions TypeScript builds, and app lint passes.

- [ ] **Step 8: Configure OpenRouter secret before deployment**

Run:

```bash
firebase functions:config:set openrouter.key="YOUR_OPENROUTER_API_KEY"
```

If using environment variables instead of legacy config, set `OPENROUTER_API_KEY` through Firebase Functions environment secrets before deploy.

- [ ] **Step 9: Commit**

```bash
git add functions lib/ai app/'(adopter)'/search.tsx
git commit -m "feat: add OpenRouter image recognition search"
```

---

### Task 8: Adoption Screening And Owner Decisions

**Files:**
- Create: `app/(adopter)/requests/[petId].tsx`
- Create: `app/(owner)/requests.tsx`
- Modify: `lib/firebase/adoption.ts`

- [ ] **Step 1: Create adopter screening form**

Create `app/(adopter)/requests/[petId].tsx`:

```tsx
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import { submitAdoptionRequest } from '@/lib/firebase/adoption';
import { getPetById } from '@/lib/firebase/pets';
import type { Pet } from '@/types/domain';

export default function AdoptionScreeningScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { firebaseUser, profile } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [adoptionReason, setAdoptionReason] = useState('');
  const [petCareExperience, setPetCareExperience] = useState('');
  const [livingCondition, setLivingCondition] = useState('');
  const [dailyCareAvailability, setDailyCareAvailability] = useState('');
  const [whatsappContact, setWhatsappContact] = useState(profile?.phoneNumber ?? '');

  useEffect(() => {
    if (petId) getPetById(petId).then(setPet);
  }, [petId]);

  async function onSubmit() {
    if (!firebaseUser || !pet) return;

    await submitAdoptionRequest({
      petId: pet.id,
      ownerId: pet.ownerId,
      adopterId: firebaseUser.uid,
      screeningAnswers: {
        adoptionReason,
        petCareExperience,
        livingCondition,
        dailyCareAvailability,
        whatsappContact,
      },
    });

    Alert.alert('Pengajuan terkirim', 'Pelepas hewan akan meninjau jawaban screening Anda.');
    router.replace('/(adopter)');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Form Screening Adopsi</Text>
      <TextField label="Alasan mengadopsi" value={adoptionReason} onChangeText={setAdoptionReason} multiline />
      <TextField label="Pengalaman merawat hewan" value={petCareExperience} onChangeText={setPetCareExperience} multiline />
      <TextField label="Kondisi tempat tinggal" value={livingCondition} onChangeText={setLivingCondition} multiline />
      <TextField label="Ketersediaan waktu merawat" value={dailyCareAvailability} onChangeText={setDailyCareAvailability} multiline />
      <TextField label="Nomor WhatsApp" value={whatsappContact} onChangeText={setWhatsappContact} keyboardType="phone-pad" />
      <Pressable style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Kirim Pengajuan</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
});
```

- [ ] **Step 2: Create owner request review screen**

Create `app/(owner)/requests.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import { listOwnerRequests, updateRequestDecision } from '@/lib/firebase/adoption';
import type { AdoptionRequest } from '@/types/domain';

export default function OwnerRequestsScreen() {
  const { firebaseUser } = useAuth();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [ownerNote, setOwnerNote] = useState('');

  async function refresh() {
    if (!firebaseUser) return;
    setRequests(await listOwnerRequests(firebaseUser.uid));
  }

  useEffect(() => {
    refresh();
  }, [firebaseUser]);

  async function decide(requestId: string, status: 'accepted' | 'rejected') {
    await updateRequestDecision(requestId, status, ownerNote);
    Alert.alert('Berhasil', status === 'accepted' ? 'Pengajuan diterima.' : 'Pengajuan ditolak.');
    setOwnerNote('');
    await refresh();
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Pengajuan Masuk</Text>
      <TextField label="Catatan keputusan" value={ownerNote} onChangeText={setOwnerNote} multiline />
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.status}>{item.status}</Text>
            <Text>Alasan: {item.screeningAnswers.adoptionReason}</Text>
            <Text>Pengalaman: {item.screeningAnswers.petCareExperience}</Text>
            <Text>Tempat tinggal: {item.screeningAnswers.livingCondition}</Text>
            <Text>WhatsApp: {item.screeningAnswers.whatsappContact}</Text>
            {item.status === 'pending' ? (
              <View style={styles.actions}>
                <Pressable style={styles.accept} onPress={() => decide(item.id, 'accepted')}>
                  <Text style={styles.actionText}>Terima</Text>
                </Pressable>
                <Pressable style={styles.reject} onPress={() => decide(item.id, 'rejected')}>
                  <Text style={styles.actionText}>Tolak</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 12, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  card: { gap: 8, borderRadius: 8, backgroundColor: '#ffffff', padding: 14, marginBottom: 10 },
  status: { color: '#0f766e', fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8 },
  accept: { flex: 1, alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 10 },
  reject: { flex: 1, alignItems: 'center', borderRadius: 8, backgroundColor: '#b91c1c', paddingVertical: 10 },
  actionText: { color: '#ffffff', fontWeight: '700' },
});
```

- [ ] **Step 3: Run verification**

Run:

```bash
npm run lint
```

Expected: lint passes.

- [ ] **Step 4: Commit**

```bash
git add app/'(adopter)'/requests app/'(owner)'/requests.tsx lib/firebase/adoption.ts
git commit -m "feat: add adoption screening workflow"
```

---

### Task 9: Monitoring Reports And Scheduled Functions

**Files:**
- Create: `functions/src/monitoring.ts`
- Create: `functions/src/notifications.ts`
- Modify: `functions/src/index.ts`
- Create: `app/(adopter)/reports/[requestId].tsx`
- Create: `app/(owner)/monitoring.tsx`
- Modify: `lib/firebase/reports.ts`

- [ ] **Step 1: Create monitoring helpers**

Create `functions/src/monitoring.ts`:

```ts
export function addOneMonth(date: Date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  return result;
}

export function isLate(dueAt: Date, now: Date) {
  const lateAt = new Date(dueAt);
  lateAt.setDate(lateAt.getDate() + 14);
  return now.getTime() > lateAt.getTime();
}
```

Create `functions/src/notifications.ts`:

```ts
import * as admin from 'firebase-admin';

export async function sendPushToUser(userId: string, title: string, body: string) {
  const user = await admin.firestore().collection('users').doc(userId).get();
  const token = user.data()?.fcmToken;

  if (!token) {
    return false;
  }

  await admin.messaging().send({
    token,
    notification: { title, body },
  });

  return true;
}
```

- [ ] **Step 2: Extend functions exports**

Add these exports to `functions/src/index.ts`:

```ts
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { addOneMonth, isLate } from './monitoring';
import { sendPushToUser } from './notifications';

export const createAdoptionApproval = onDocumentUpdated(
  { region: 'asia-southeast2', document: 'adoptionRequests/{requestId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after || before.status === after.status || after.status !== 'accepted') {
      return;
    }

    const dueAt = addOneMonth(new Date());

    await admin.firestore().collection('pets').doc(after.petId).update({
      status: 'adopted',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await admin.firestore().collection('postAdoptionReports').add({
      requestId: event.params.requestId,
      petId: after.petId,
      ownerId: after.ownerId,
      adopterId: after.adopterId,
      dueAt: admin.firestore.Timestamp.fromDate(dueAt),
      status: 'scheduled',
      conditionPhotoUrls: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendPushToUser(after.adopterId, 'Adopsi disetujui', 'Laporan kondisi hewan wajib dikirim 1 bulan setelah adopsi.');
  },
);

export const sendMonitoringReminder = onSchedule(
  { region: 'asia-southeast2', schedule: 'every day 09:00', timeZone: 'Asia/Jakarta' },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await admin
      .firestore()
      .collection('postAdoptionReports')
      .where('status', '==', 'scheduled')
      .where('dueAt', '<=', now)
      .get();

    await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        await docSnapshot.ref.update({ status: 'due' });
        await sendPushToUser(data.adopterId, 'Laporan AdoptPet jatuh tempo', 'Silakan unggah foto kondisi hewan terbaru.');
      }),
    );
  },
);

export const markLateMonitoring = onSchedule(
  { region: 'asia-southeast2', schedule: 'every day 10:00', timeZone: 'Asia/Jakarta' },
  async () => {
    const snapshot = await admin
      .firestore()
      .collection('postAdoptionReports')
      .where('status', 'in', ['scheduled', 'due'])
      .get();

    await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const dueAt = data.dueAt.toDate();

        if (!isLate(dueAt, new Date())) {
          return;
        }

        await docSnapshot.ref.update({ status: 'late' });
        await admin.firestore().collection('pets').doc(data.petId).update({ status: 'monitoring_late' });
        await sendPushToUser(data.ownerId, 'Laporan terlambat', 'Pengadopsi belum mengirim laporan kondisi hewan.');
      }),
    );
  },
);

export const notifyOwnerOnReport = onDocumentUpdated(
  { region: 'asia-southeast2', document: 'postAdoptionReports/{reportId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after || before.status === after.status || after.status !== 'submitted') {
      return;
    }

    await admin.firestore().collection('pets').doc(after.petId).update({ status: 'monitoring_submitted' });
    await sendPushToUser(after.ownerId, 'Laporan diterima', 'Pengadopsi telah mengirim laporan kondisi hewan.');
  },
);
```

- [ ] **Step 3: Create adopter report screen**

Create `app/(adopter)/reports/[requestId].tsx`:

```tsx
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { PhotoPicker } from '@/components/forms/PhotoPicker';
import { TextField } from '@/components/forms/TextField';
import { useAuth } from '@/contexts/auth-context';
import { submitMonitoringReport } from '@/lib/firebase/reports';
import { uploadImageAsync } from '@/lib/firebase/storage';

export default function MonitoringReportScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { firebaseUser } = useAuth();
  const [conditionPhotoUris, setConditionPhotoUris] = useState<string[]>([]);
  const [conditionNote, setConditionNote] = useState('');

  async function onSubmit() {
    if (!firebaseUser || !requestId) return;

    const conditionPhotoUrls = await Promise.all(
      conditionPhotoUris.map((uri, index) => uploadImageAsync(uri, `reports/${firebaseUser.uid}/${requestId}-${index}.jpg`)),
    );

    await submitMonitoringReport(requestId, { conditionPhotoUrls, conditionNote });
    Alert.alert('Laporan terkirim', 'Pelepas hewan akan menerima notifikasi.');
    router.replace('/(adopter)');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Laporan Kondisi Hewan</Text>
      <PhotoPicker label="Foto kondisi terkini" uris={conditionPhotoUris} onChange={setConditionPhotoUris} />
      <TextField label="Catatan kondisi" value={conditionNote} onChangeText={setConditionNote} multiline />
      <Pressable style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Kirim Laporan</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  button: { alignItems: 'center', borderRadius: 8, backgroundColor: '#0f766e', paddingVertical: 14 },
  buttonText: { color: '#ffffff', fontWeight: '700' },
});
```

- [ ] **Step 4: Create owner monitoring screen**

Create `app/(owner)/monitoring.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { listReportsForOwner } from '@/lib/firebase/reports';
import type { PostAdoptionReport } from '@/types/domain';

export default function OwnerMonitoringScreen() {
  const { firebaseUser } = useAuth();
  const [reports, setReports] = useState<PostAdoptionReport[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    listReportsForOwner(firebaseUser.uid).then(setReports);
  }, [firebaseUser]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Monitoring Pasca-Adopsi</Text>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.status}>{item.status}</Text>
            <Text>Jatuh tempo: {String(item.dueAt)}</Text>
            <Text>Catatan: {item.conditionNote || '-'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  card: { gap: 6, borderRadius: 8, backgroundColor: '#ffffff', padding: 14, marginBottom: 10 },
  status: { color: '#0f766e', fontWeight: '800' },
});
```

- [ ] **Step 5: Run verification**

Run:

```bash
npm test --prefix functions
npm run build --prefix functions
npm run lint
```

Expected: Functions tests/build pass and app lint passes.

- [ ] **Step 6: Commit**

```bash
git add functions/src app/'(adopter)'/reports app/'(owner)'/monitoring.tsx lib/firebase/reports.ts
git commit -m "feat: add post-adoption monitoring flow"
```

---

### Task 10: Route Guard, Notifications, And App Polish

**Files:**
- Modify: `contexts/auth-context.tsx`
- Modify: `app/_layout.tsx`
- Modify: `app/(owner)/index.tsx`
- Modify: `app/(adopter)/index.tsx`
- Modify: `lib/firebase/notifications.ts`

- [ ] **Step 1: Add root redirect logic**

Add this helper near the stack in `app/_layout.tsx`:

```tsx
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/auth-context';

function InitialRouteGuard() {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  if (!firebaseUser) return <Redirect href="/auth/login" />;
  if (!profile?.phoneNumber || !profile.fullAddress) return <Redirect href="/profile/setup" />;
  return <Redirect href={profile.role === 'owner' ? '/(owner)' : '/(adopter)'} />;
}
```

Add a stack screen for `index` and create `app/index.tsx`:

```tsx
import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#0f766e" />
    </View>
  );
}
```

Use the guard in `app/index.tsx` if preferred:

```tsx
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

export default function IndexScreen() {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  if (!firebaseUser) return <Redirect href="/auth/login" />;
  if (!profile?.phoneNumber || !profile.fullAddress) return <Redirect href="/profile/setup" />;
  return <Redirect href={profile.role === 'owner' ? '/(owner)' : '/(adopter)'} />;
}
```

- [ ] **Step 2: Register notification token after login**

In `contexts/auth-context.tsx`, after profile is loaded, call:

```ts
if (user && nextProfile) {
  registerPushToken(user.uid).catch(() => {
    // Push notification is a reminder, not a hard requirement.
  });
}
```

Import:

```ts
import { registerPushToken } from '@/lib/firebase/notifications';
```

- [ ] **Step 3: Add logout buttons to dashboards**

In owner and adopter index screens, import `logout`:

```ts
import { logout } from '@/lib/firebase/auth';
```

Add a button:

```tsx
<Pressable style={styles.logoutButton} onPress={logout}>
  <Text style={styles.logoutText}>Keluar</Text>
</Pressable>
```

Add styles:

```ts
logoutButton: { borderRadius: 8, borderWidth: 1, borderColor: '#0f766e', paddingHorizontal: 12, paddingVertical: 8 },
logoutText: { color: '#0f766e', fontWeight: '700' },
```

- [ ] **Step 4: Run verification**

Run:

```bash
npm run lint
```

Expected: lint passes.

- [ ] **Step 5: Commit**

```bash
git add app contexts lib/firebase/notifications.ts
git commit -m "feat: add routing guards and notification registration"
```

---

### Task 11: Firebase Rules Hardening And Deployment Checklist

**Files:**
- Modify: `firestore.rules`
- Modify: `storage.rules`
- Create: `docs/testing/firebase-deployment-checklist.md`

- [ ] **Step 1: Harden role immutability in `firestore.rules`**

Update `users` rules:

```js
match /users/{userId} {
  allow create: if isSelf(userId)
    && request.resource.data.role in ['owner', 'adopter'];
  allow read: if isSelf(userId);
  allow update: if isSelf(userId)
    && request.resource.data.role == resource.data.role;
}
```

- [ ] **Step 2: Harden adoption request creation**

Update `adoptionRequests` create rule:

```js
allow create: if isAdopter()
  && request.resource.data.adopterId == request.auth.uid
  && request.resource.data.status == 'pending'
  && request.resource.data.keys().hasAll(['petId', 'ownerId', 'adopterId', 'screeningAnswers', 'status']);
```

- [ ] **Step 3: Harden report writes**

Update `postAdoptionReports` rules:

```js
allow create: if false;
allow update: if signedIn()
  && resource.data.adopterId == request.auth.uid
  && request.resource.data.status == 'submitted';
```

Only Cloud Functions creates report schedules; adopters only submit existing reports.

- [ ] **Step 4: Create deployment checklist**

Create `docs/testing/firebase-deployment-checklist.md`:

```md
# Firebase Deployment Checklist

- Firebase project is created.
- Android app is registered in Firebase.
- `.env` contains Expo public Firebase keys.
- Google Maps API key is enabled for Android Maps SDK.
- OpenRouter API key is configured in Firebase Functions environment.
- Firestore rules are deployed.
- Storage rules are deployed.
- Functions are built successfully.
- `analyzePetImage` is deployed.
- Scheduled functions are deployed.
- Test owner account can register.
- Test adopter account can register.
- Owner can create a pet post with image upload.
- Adopter can browse available pets.
- Adopter can run manual search.
- Adopter can run visual search.
- Owner can accept an adoption request.
- Monitoring report is created after approval.
```

- [ ] **Step 5: Run verification**

Run:

```bash
firebase deploy --only firestore:rules,storage
npm run build --prefix functions
```

Expected: Firestore and Storage rules deploy successfully, and Functions build passes.

- [ ] **Step 6: Commit**

```bash
git add firestore.rules storage.rules docs/testing/firebase-deployment-checklist.md
git commit -m "chore: harden Firebase rules"
```

---

### Task 12: Thesis Black Box Test Plan

**Files:**
- Create: `docs/testing/black-box-test-plan.md`
- Modify: `README.md`

- [ ] **Step 1: Create Black Box Testing document**

Create `docs/testing/black-box-test-plan.md`:

```md
# AdoptPet Black Box Test Plan

| ID | Scenario | Input | Expected Result |
| --- | --- | --- | --- |
| BB-01 | Register as pelepas hewan | Valid name, email, password, role owner | Account created and routed to owner area |
| BB-02 | Register as calon pengadopsi | Valid name, email, password, role adopter | Account created and routed to adopter area |
| BB-03 | Complete profile | Phone, full address, coordinates | Profile saved in Firestore |
| BB-04 | Create pet post | Pet photo, visual attributes, health info, address | Pet stored with status available |
| BB-05 | Manual search | Species and color filter | Matching pets are displayed |
| BB-06 | Haversine distance sorting | User coordinates and pet coordinates | Nearest pets appear first |
| BB-07 | Visual search success | Clear pet reference image | OpenRouter returns JSON and matching pets are shown |
| BB-08 | Visual search failure | Invalid image or network failure | Friendly error appears and manual search remains usable |
| BB-09 | Submit adoption screening | Complete screening form | Request stored with status pending |
| BB-10 | Accept adoption request | Owner selects accept | Request accepted, pet adopted, report schedule created |
| BB-11 | Reject adoption request | Owner selects reject | Request rejected and pet remains available if no accepted request |
| BB-12 | Monitoring reminder | Report due date reached | Reminder status appears and push notification is attempted |
| BB-13 | Submit monitoring report | Current pet photo and condition note | Report status becomes submitted |
| BB-14 | Missing GPS permission | User denies location access | App allows manual address and hides distance sorting |
| BB-15 | Missing FCM token | Notification permission denied | Monitoring status remains visible inside app |
```
```

- [ ] **Step 2: Update `README.md`**

Replace starter README content with:

```md
# AdoptPet

AdoptPet is a React Native and Expo Android application for pet adoption. It uses Firebase for online backend services, Google Maps for location features, and OpenRouter `google/gemini-2.5-flash` for image-based pet attribute recognition.

## Main Features

- Fixed user roles: Pelepas Hewan and Calon Pengadopsi
- Pet posting with health information and proof uploads
- Manual pet search
- Visual pet search using OpenRouter Gemini model
- Distance sorting with Haversine Formula
- Adoption screening form
- One-month post-adoption monitoring report

## Development

```bash
npm install
npm run android
```

## Tests

```bash
npm test
npm run lint
```

## Documentation

- Design spec: `docs/superpowers/specs/2026-05-07-adoptpet-online-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-07-adoptpet-online-mvp.md`
- Black Box Testing: `docs/testing/black-box-test-plan.md`
```

- [ ] **Step 3: Run final verification**

Run:

```bash
npm test
npm run lint
npm run build --prefix functions
```

Expected: all tests pass, lint passes, Functions build passes.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/testing/black-box-test-plan.md
git commit -m "docs: add AdoptPet testing documentation"
```

---

## Final Verification

After all tasks are complete, run:

```bash
git status --short
npm test
npm run lint
npm run build --prefix functions
```

Expected:

- `git status --short` shows no uncommitted implementation files.
- All Jest tests pass.
- Expo lint passes.
- Firebase Functions TypeScript build passes.

Then run a manual Android demo:

```bash
npm run android
```

Manual demo checklist:

- Register one owner account.
- Complete owner profile with full address and coordinates.
- Create one pet post with image and health information.
- Register one adopter account.
- Complete adopter profile with full address and coordinates.
- Browse available pet.
- Run manual search.
- Run visual search.
- Open pet detail and map.
- Submit adoption screening.
- Accept request from owner account.
- Confirm monitoring report exists.
- Submit monitoring report as adopter.

## Self-Review Notes

Spec coverage:

- Firebase Auth, Firestore, Storage, Functions, and FCM are covered by Tasks 3, 4, 5, 8, 9, 10, and 11.
- OpenRouter `google/gemini-2.5-flash` visual recognition is covered by Task 7.
- Google Maps and Haversine are covered by Tasks 2 and 6.
- Owner and adopter fixed roles are covered by Tasks 4 and 10.
- Pet health transparency is covered by Task 5 and Task 6.
- Adoption screening is covered by Task 8.
- One-month monitoring is covered by Task 9.
- Black Box Testing documentation is covered by Task 12.

Placeholder scan:

- No unresolved placeholders remain in this plan.
- The OpenRouter API key setup is explicit and intentionally separate from `.env.example`.
- Every task has concrete files, commands, and expected outcomes.

Type consistency:

- Domain statuses match the approved design.
- `VisualAttributes` uses consistent keys across tests, client code, functions, and Firestore logs.
- Adoption request and monitoring report field names are consistent with the design spec.
