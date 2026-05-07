# AdoptPet Online Application Design

Date: 2026-05-07
Project: AdoptPet
Thesis topic: Pengembangan Aplikasi Adopsi Hewan Berbasis Mobile Menggunakan Image Recognition dan Geolocation

## Summary

AdoptPet is an Android-focused mobile application for pet adoption. The application uses real online services: Firebase for authentication, database, storage, backend functions, and notifications; Google Maps for map and address support; and OpenRouter for multimodal image recognition through the `google/gemini-2.5-flash` model.

The system has two fixed user roles: `Pelepas Hewan` and `Calon Pengadopsi`. A user chooses one role during registration and cannot operate as both roles from the same account. There is no admin role. Trust and validation are handled through structured pet health information, adoption screening, owner approval, system status, and one-month post-adoption monitoring.

## Goals

- Help calon pengadopsi find pets by visual criteria such as species, color, fur pattern, and estimated breed.
- Help users find pets based on distance using geolocation and Haversine distance calculation.
- Improve health transparency by storing vaccination, sterilization, medical history, and optional supporting proof.
- Improve post-adoption accountability through a required one-time condition report after one month.
- Keep the system focused enough for thesis implementation and Black Box Testing.

## Non-Goals

- No buying, selling, payment gateway, or commercial transaction flow.
- No desktop website version.
- No admin dashboard or admin moderation workflow.
- No training a custom CNN model from scratch.
- No recurring long-term monitoring beyond the one-month report.
- No chat, rating, social feed, or marketplace expansion in the initial scope.

## Technology Choices

- Mobile app: React Native with Expo Router.
- Authentication: Firebase Authentication.
- Database: Cloud Firestore.
- File storage: Firebase Storage.
- Backend logic: Firebase Cloud Functions.
- Notifications: Firebase Cloud Messaging.
- Maps and coordinates: Google Maps Platform.
- Visual recognition: OpenRouter Chat Completions API using `google/gemini-2.5-flash`.
- Distance sorting: Haversine Formula, implemented in application or Cloud Function logic.

OpenRouter is called only from Firebase Cloud Functions. The mobile application never stores or sends the OpenRouter API key directly. This keeps the API key out of the client bundle and makes AI request logging easier to use in the thesis evaluation.

## User Roles

### Pelepas Hewan

The pelepas hewan can:

- Register and log in as a fixed owner role.
- Complete profile data, phone number, full address, and coordinates.
- Create pet adoption posts.
- Upload pet photos and optional health proof files.
- Fill structured pet health information.
- Review incoming adoption screening forms.
- Accept or reject adoption requests.
- View the post-adoption monitoring status.
- Receive a notification when the adopter submits the one-month report.

### Calon Pengadopsi

The calon pengadopsi can:

- Register and log in as a fixed adopter role.
- Complete profile data, phone number, full address, and coordinates.
- Browse available pets.
- Search and filter pets manually.
- Search by uploading a reference pet image.
- View pet details, health information, map location, and distance.
- Submit an adoption screening form.
- Receive notification when an adoption request is approved or rejected.
- Submit one post-adoption condition report after one month.

## Main Workflows

### Registration

1. User registers with email and password.
2. User chooses exactly one role: `Pelepas Hewan` or `Calon Pengadopsi`.
3. User completes profile data, phone number, full address, and location coordinates.
4. Firebase stores the profile in `users`.

### Pet Posting

1. Pelepas hewan creates a pet post.
2. The application asks for pet photos, name, species, estimated breed, colors, fur pattern, age, sex, description, health status, full address, and coordinates.
3. Optional health proof images can be uploaded to Firebase Storage.
4. Firestore stores the post in `pets` with status `available`.

### Visual Search

1. Calon pengadopsi uploads a reference image.
2. The mobile app sends the image request to a Firebase Cloud Function.
3. The Cloud Function calls OpenRouter with `google/gemini-2.5-flash`.
4. The model returns structured JSON:

```json
{
  "species": "cat",
  "primaryColor": "white",
  "secondaryColor": "orange",
  "furPattern": "bicolor",
  "estimatedBreed": "domestic shorthair",
  "confidence": 0.78
}
```

5. The application matches the extracted attributes against `pets`.
6. Results are shown as visual similarity matches. Breed is treated as an estimate, not a guaranteed fact.

### Location Search

1. Calon pengadopsi grants location access or enters address manually.
2. The app stores coordinates for the user and pets.
3. Haversine Formula calculates distance between adopter and pet coordinates.
4. Search results can be sorted by nearest distance.
5. The map shows pet location markers and distance information.

The app stores full addresses, but the public listing should prioritize area and distance. Full address visibility can be limited to serious adoption flow screens to reduce unnecessary exposure of personal location data.

### Adoption Request

1. Calon pengadopsi opens a pet detail page.
2. User submits a screening form.
3. Screening answers include adoption reason, pet care experience, living condition, availability for care, and WhatsApp contact.
4. Firestore stores the request in `adoptionRequests` with status `pending`.
5. Pelepas hewan reviews the request.
6. Pelepas hewan accepts or rejects the request.
7. If accepted, the pet moves into an adopted flow and the monitoring due date is created.

### One-Month Monitoring

1. When adoption is approved, the system creates a monitoring record with due date one month after approval.
2. Firebase Cloud Function sends an FCM reminder to the adopter when the report is due.
3. Adopter uploads a current pet condition photo and a short condition note.
4. Firestore stores the report in `postAdoptionReports`.
5. Pelepas hewan receives notification that the report was submitted.
6. If the report is not submitted within the allowed late period, the system marks it as late and notifies the pelepas hewan.

## Core Statuses

Pet and adoption flow statuses:

- `available`
- `requested`
- `approved`
- `adopted`
- `monitoring_due`
- `monitoring_submitted`
- `monitoring_late`

Adoption request statuses:

- `pending`
- `accepted`
- `rejected`
- `cancelled`

Monitoring report statuses:

- `scheduled`
- `due`
- `submitted`
- `late`

## Firestore Collections

### `users`

Fields:

- `id`
- `name`
- `email`
- `role`
- `phoneNumber`
- `fullAddress`
- `coordinates`
- `fcmToken`
- `createdAt`
- `updatedAt`

### `pets`

Fields:

- `id`
- `ownerId`
- `name`
- `species`
- `estimatedBreed`
- `primaryColor`
- `secondaryColor`
- `furPattern`
- `age`
- `sex`
- `description`
- `photoUrls`
- `vaccinationStatus`
- `sterilizationStatus`
- `medicalHistory`
- `healthProofUrls`
- `fullAddress`
- `coordinates`
- `status`
- `aiAttributes`
- `createdAt`
- `updatedAt`

### `adoptionRequests`

Fields:

- `id`
- `petId`
- `ownerId`
- `adopterId`
- `screeningAnswers`
- `status`
- `ownerNote`
- `requestedAt`
- `decidedAt`

### `postAdoptionReports`

Fields:

- `id`
- `requestId`
- `petId`
- `ownerId`
- `adopterId`
- `dueAt`
- `status`
- `conditionPhotoUrls`
- `conditionNote`
- `submittedAt`
- `createdAt`

### `aiSearchLogs`

Fields:

- `id`
- `userId`
- `model`
- `inputImagePath`
- `resultJson`
- `confidence`
- `errorMessage`
- `createdAt`

## Cloud Functions

### `analyzePetImage`

Receives an image reference, calls OpenRouter with `google/gemini-2.5-flash`, validates JSON output, logs the result, and returns normalized visual attributes.

### `createAdoptionApproval`

Runs when a pelepas hewan accepts a request. It updates the request status, updates the pet adoption status, and creates a one-month monitoring record.

### `sendMonitoringReminder`

Runs on schedule and sends FCM reminders for monitoring records that are due.

### `markLateMonitoring`

Runs on schedule and marks monitoring records as late when the adopter has not submitted the report after the allowed late period.

### `notifyOwnerOnReport`

Runs after a monitoring report is submitted and notifies the pelepas hewan.

## Error Handling

AI recognition errors:

- If OpenRouter fails, times out, or returns invalid JSON, the app shows a friendly error and lets the user continue with manual filters.
- If confidence is low, results are shown as estimates.
- Every AI failure is logged in `aiSearchLogs`.

Location errors:

- If GPS permission is denied, the user can enter an address manually.
- If coordinates are missing, map and distance features show a clear unavailable state.
- Haversine sorting only runs when both user and pet coordinates are available.

Notification errors:

- If FCM token is missing, monitoring status still appears inside the app.
- Push notification is treated as a reminder, not the only source of truth.

Data and permission errors:

- Firestore Security Rules restrict each role to its allowed operations.
- A pelepas hewan can manage only their own pet posts and requests.
- A calon pengadopsi can create requests and submit reports only for their approved adoption flow.

## Testing Plan

Black Box Testing will cover:

- Register as pelepas hewan.
- Register as calon pengadopsi.
- Create a complete pet post.
- Upload pet and health proof photos.
- Search pets manually.
- Search pets with image recognition.
- Validate JSON attributes from OpenRouter.
- Sort pets by Haversine distance.
- Submit adoption screening form.
- Accept an adoption request.
- Reject an adoption request.
- Create one-month monitoring after approval.
- Send or display monitoring reminder.
- Submit post-adoption condition report.
- Notify pelepas hewan after report submission.
- Handle AI failure.
- Handle denied location permission.
- Handle missing FCM token.

## Thesis Alignment

This design supports the existing thesis direction:

- Image recognition is implemented through OpenRouter with Gemini multimodal model.
- Geolocation is implemented with Google Maps and Haversine distance sorting.
- Health transparency is represented through structured health fields and optional proof uploads.
- Post-adoption safety is represented through one required one-month monitoring report.
- The implementation remains focused on Android mobile and avoids payment, admin moderation, and nonessential marketplace features.
