export type UserRole = 'client' | 'owner' | 'driver' | 'admin';

export type CameroonCity = string;

export type PaymentMethod = 'MTN MoMo' | 'Orange Money' | 'Carte bancaire';

export type PaymentProvider = 'mtn-momo' | 'orange-money' | 'card';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';

export type AccountStatus = 'active' | 'pending_validation' | 'suspended' | 'banned';

export type KycStatus = 'pending' | 'approved' | 'rejected';

export type DisputeStatus = 'none' | 'open' | 'resolved';

export type AdminRole = 'super_admin' | 'moderator' | 'accountant';

export type DriverLicense = {
  fullName: string;
  licenseNumber: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  categories: string;
};

export type AppUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  photoUrl?: string;
  role: UserRole;
  ownerId?: string;
  city: CameroonCity;
  createdAt: Date;
  status?: AccountStatus;
  kycStatus?: KycStatus;
  ratingAverage?: number;
  missionsCount?: number;
  adminLastActionReason?: string;
  adminRole?: AdminRole;
  expoPushTokens?: string[];
  pushTokenUpdatedAt?: Date;
  documents?: {
    driverLicenseUrl?: string;
    nationalIdUrl?: string;
    nationalIdBackUrl?: string;
    profilePhotoUrl?: string;
  };
  driverProfile?: {
    experienceYears?: number;
    isIndependent?: boolean;
    isAvailable?: boolean;
    licenseCategories?: string;
    licenseExpiryDate?: string;
    licenseNumber?: string;
    nationalIdNumber?: string;
    profilePhotoUrl?: string;
    pricePerDay?: number;
    blockedDates?: string[];
  };
};

export type Car = {
  id: string;
  ownerId: string;
  brand: string;
  model: string;
  year: number;
  city: CameroonCity;
  pricePerDay: number;
  imageUrl: string;
  imageUrls?: string[];
  seats: number;
  transmission: 'Automatique' | 'Manuelle';
  fuelType: 'Essence' | 'Diesel' | 'Hybride' | 'Electrique';
  isAvailable: boolean;
  description: string;
  adminStatus?: 'pending_review' | 'approved' | 'rejected';
  documentsVerified?: boolean;
  allowIndependentDrivers?: boolean;
  technicalSheet?: {
    licensePlate?: string;
    chassisNumber?: string;
    mileage?: number;
    insuranceExpiry?: string;
    technicalInspectionExpiry?: string;
    registrationDocumentUrl?: string;
  };
};

export type ContractStatus = 'pending' | 'client_signed' | 'both_signed';

export type Booking = {
  id: string;
  carId: string;
  carBrand?: string;
  carModel?: string;
  ownerId: string;
  clientId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  driverLicense: DriverLicense;
  status: BookingStatus;
  createdAt: Date;
  city?: CameroonCity;
  disputeStatus?: DisputeStatus;
  refundStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  depositStatus?: 'held' | 'released' | 'captured';
  contractStatus?: ContractStatus;
  clientSignatureUrl?: string;
  contractSignedAt?: Date;
  contractRef?: string;
  cancelledAt?: Date;
  cancellationFee?: number;
  cancellationPolicy?: 'free_before_48h' | 'late_10_percent';
  refundAmount?: number;
  withDriver?: boolean;
  driverId?: string;
  driverName?: string;
  driverPhotoUrl?: string;
  driverPricePerDay?: number;
  reviewSubmitted?: boolean;
  driverReviewSubmitted?: boolean;
};

export type PaymentFlow = {
  id: string;
  amount: number;
  bookingId?: string;
  clientId?: string;
  currency?: string;
  method?: PaymentMethod;
  phone?: string;
  provider?: PaymentProvider;
  reference?: string;
  status?: 'pending' | 'success' | 'failed';
  providerStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReviewTargetType = 'car' | 'driver' | 'client';

export type ReviewStatus = 'published' | 'flagged' | 'removed';

export type Review = {
  id: string;
  authorId: string;
  targetId: string;
  targetType: ReviewTargetType;
  rating: number;
  comment: string;
  status: ReviewStatus;
  flaggedReason?: string;
  createdAt?: Date;
  moderatedAt?: Date;
  moderatedBy?: string;
};

export type PromoBanner = {
  id: string;
  title: string;
  message: string;
  city?: CameroonCity;
  isActive: boolean;
  createdAt?: Date;
};

export type AdminLog = {
  id: string;
  adminId: string;
  action: string;
  targetId?: string;
  targetType?: string;
  createdAt?: Date;
};
