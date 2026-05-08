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
  adoptedById?: string;
  adoptedRequestId?: string;
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
  conditionPhotoPaths: string[];
  conditionPhotoUrls?: string[];
  conditionNote?: string;
  submittedAt?: number;
  createdAt: number;
};
