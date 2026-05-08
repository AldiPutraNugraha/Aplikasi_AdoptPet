# AdoptPet Black Box Test Plan

| ID | Scenario | Input | Expected Result |
| --- | --- | --- | --- |
| BB-01 | Register as pelepas hewan | Valid name, email, password, role owner | Account is created and routed to profile setup |
| BB-02 | Register as calon pengadopsi | Valid name, email, password, role adopter | Account is created and routed to profile setup |
| BB-03 | Prevent role changes | Existing account attempts to change role after registration | Role remains unchanged and update is rejected by Firestore rules |
| BB-04 | Complete owner profile | Phone number, full address, selected coordinates | Profile is saved in Firestore and owner dashboard opens |
| BB-05 | Complete adopter profile | Phone number, full address, selected coordinates | Profile is saved in Firestore and adopter dashboard opens |
| BB-06 | Create pet post | Pet photo, visual attributes, health info, full address, coordinates | Pet is stored with status available and appears in owner pet list |
| BB-07 | Upload invalid pet image | Non-image file or file larger than 8 MB | Upload is rejected by Storage rules |
| BB-08 | Browse available pets | Adopter opens browse screen | Available pets are displayed from Firestore |
| BB-09 | Manual search | Species or primary color filter | Matching pets are displayed |
| BB-10 | Haversine distance sorting | User coordinates and pet coordinates | Nearest pets appear first |
| BB-11 | Missing GPS permission | User denies location access | Search remains usable and results are shown without distance sorting |
| BB-12 | Open pet detail and map | Adopter selects an available pet | Pet detail opens and Google Maps marker is shown when coordinates exist |
| BB-13 | Visual search success | Clear pet reference image | OpenRouter returns JSON attributes and matching pets are shown |
| BB-14 | Visual search invalid image | Empty, non-image, or oversized reference file | Friendly error appears and manual search remains usable |
| BB-15 | Visual search quota reached | User exceeds daily AI search limit | Request is rejected and quota message is shown |
| BB-16 | Submit incomplete screening | Required screening answer is empty | Request is not submitted and validation message appears |
| BB-17 | Submit adoption screening | Complete screening form | Request is stored with status pending |
| BB-18 | Owner views adoption requests | Owner opens request tab | Pending requests for owned pets are displayed |
| BB-19 | Accept adoption request | Owner selects accept and enters note | Request becomes accepted, pet becomes adopted, report schedule is created |
| BB-20 | Reject adoption request | Owner selects reject and enters note | Request becomes rejected and pet remains available |
| BB-21 | Monitoring reminder due | Report due date is reached | Report status becomes due and push notification is attempted |
| BB-22 | Submit monitoring report | Current pet photo and condition note | Report status becomes submitted and owner can view the report |
| BB-23 | Late monitoring report | Adopter does not submit after due grace period | Report becomes late and pet status becomes monitoring_late |
| BB-24 | Missing FCM token | Notification permission is denied | Monitoring status remains visible inside the app |
| BB-25 | Logout | User taps logout | Push token cleanup is attempted and user returns to login flow |
