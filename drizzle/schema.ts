import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  datetime,
  float,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Supports both clients and photographers with role-based access.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "photographer", "editor", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Photographer profile information
 */
export const photographers = mysqlTable("photographers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bio: text("bio"),
  profileImage: varchar("profileImage", { length: 500 }),
  yearsExperience: int("yearsExperience"),
  latitude: float("latitude"),
  longitude: float("longitude"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 10 }),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: int("totalReviews").default(0),
  isVerified: boolean("isVerified").default(false),
  isApproved: boolean("isApproved").default(false),
  isActive: boolean("isActive").default(true),
  /**
   * Onboarding progress tracking.
   * 0 = profile created (step 1 done)
   * 1 = services added (step 2 done)
   * 2 = availability set (step 3 done)
   * 3 = portfolio uploaded (step 4 done — fully complete)
   * null = not started (should not happen after createProfile)
   */
  onboardingStep: int("onboardingStep").default(0).notNull(),
  onboardingCompletedAt: timestamp("onboardingCompletedAt"),
  stripeConnectId: varchar("stripeConnectId", { length: 255 }),
  stripeConnectStatus: mysqlEnum("stripeConnectStatus", ["not_connected", "pending_verification", "connected"])
    .default("not_connected")
    .notNull(),
  bankAccountLast4: varchar("bankAccountLast4", { length: 4 }),
  bankAccountName: varchar("bankAccountName", { length: 100 }),
  payoutSchedule: varchar("payoutSchedule", { length: 50 }).default("daily"),
  // Legal & Compliance
  fullLegalName: varchar("fullLegalName", { length: 255 }),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  ssn: varchar("ssn", { length: 11 }),
  ein: varchar("ein", { length: 12 }),
  agreementAcceptedAt: timestamp("agreementAcceptedAt"),
  agreementVersion: varchar("agreementVersion", { length: 10 }),
  backgroundCheckAuthorized: boolean("backgroundCheckAuthorized").default(false),
  backgroundCheckCompletedAt: timestamp("backgroundCheckCompletedAt"),
  backgroundCheckStatus: mysqlEnum("backgroundCheckStatus", ["pending", "approved", "rejected"]).default("pending"),
  // Equipment
  cameraType: varchar("cameraType", { length: 255 }),
  hasDrone: boolean("hasDrone").default(false),
  droneServicesEnabled: boolean("droneServicesEnabled").default(false),
  faaLicenseExpiresAt: timestamp("faaLicenseExpiresAt"),
  faaLicenseUploadedAt: timestamp("faaLicenseUploadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Photographer = typeof photographers.$inferSelect;
export type InsertPhotographer = typeof photographers.$inferInsert;

/**
 * Services offered on the platform (admin-controlled)
 * Includes base services and add-ons
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  serviceType: mysqlEnum("serviceType", ["base", "addon"]).default("base").notNull(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  deliveryTime: varchar("deliveryTime", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Admin-controlled pricing rules based on property size
 * Replaces hardcoded pricing in the frontend
 */
export const pricingRules = mysqlTable("pricing_rules", {
  id: int("id").autoincrement().primaryKey(),
  minSqft: int("minSqft").notNull(),
  maxSqft: int("maxSqft"), // null means no upper bound (4000+)
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  label: varchar("label", { length: 100 }), // e.g. "Up to 1000 sqft"
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;

/**
 * Photographer service offerings (many-to-many with custom pricing)
 */
export const photographerServices = mysqlTable("photographer_services", {
  id: int("id").autoincrement().primaryKey(),
  photographerId: int("photographerId").notNull(),
  serviceId: int("serviceId").notNull(),
  customPrice: decimal("customPrice", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PhotographerService = typeof photographerServices.$inferSelect;
export type InsertPhotographerService = typeof photographerServices.$inferInsert;

/**
 * Photographer availability slots
 * dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
 * specificDate: for blocking specific dates (isAvailable=false)
 */
export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  photographerId: int("photographerId").notNull(),
  dayOfWeek: int("dayOfWeek"), // 0-6, null for specific dates
  startTime: varchar("startTime", { length: 5 }), // HH:MM format
  endTime: varchar("endTime", { length: 5 }), // HH:MM format
  specificDate: datetime("specificDate"),
  isAvailable: boolean("isAvailable").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;

/**
 * Bookings from clients to photographers
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  bookingCode: varchar("bookingCode", { length: 20 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  photographerId: int("photographerId"),
  propertyAddress: text("propertyAddress").notNull(),
  propertyType: varchar("propertyType", { length: 50 }),
  propertySize: int("propertySize"), // in sqft
  latitude: float("latitude"),
  longitude: float("longitude"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 10 }),
  specialInstructions: text("specialInstructions"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }),
  addOnPrice: decimal("addOnPrice", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  scheduledDate: datetime("scheduledDate").notNull(),
  duration: int("duration").default(120), // in minutes
  status: mysqlEnum("status", [
    "pending",
    "accepted",
    "rejected",
    "in_progress",
    "photos_uploaded",
    "editing",
    "delivered",
    "completed",
    "cancelled",
  ])
    .default("pending")
    .notNull(),
  paymentStatus: mysqlEnum("paymentStatus", [
    "pending",
    "completed",
    "failed",
    "refunded",
  ])
    .default("pending")
    .notNull(),
  editorId: int("editorId"), // assigned editor (users.id where role=editor)
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Booking services (normalized many-to-many)
 */
export const bookingServices = mysqlTable("booking_services", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  serviceId: int("serviceId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingService = typeof bookingServices.$inferSelect;
export type InsertBookingService = typeof bookingServices.$inferInsert;

/**
 * Reviews and ratings for photographers
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(), // one review per booking
  photographerId: int("photographerId").notNull(),
  clientId: int("clientId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Portfolio images for photographers
 */
export const portfolioImages = mysqlTable("portfolio_images", {
  id: int("id").autoincrement().primaryKey(),
  photographerId: int("photographerId").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),

  description: text("description"),
  isAiGenerated: boolean("isAiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type InsertPortfolioImage = typeof portfolioImages.$inferInsert;

/**
 * Notifications for clients and photographers
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "booking_confirmation",
    "booking_accepted",
    "booking_rejected",
    "pre_shoot_reminder",
    "booking_completed",
    "review_request",
    "payment_confirmation",
    "photographer_approved",
    "new_booking_request",
    "photos_delivered",
  ])
    .notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message"),
  relatedBookingId: int("relatedBookingId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Transactions for payment tracking
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  grossAmount: decimal("grossAmount", { precision: 10, scale: 2 }),
  photographerShare: decimal("photographerShare", { precision: 10, scale: 2 }),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"])
    .default("pending")
    .notNull(),
  stripeTransactionId: varchar("stripeTransactionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Photos uploaded by photographers for bookings
 */
export const bookingPhotos = mysqlTable("booking_photos", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileSize: int("fileSize"), // in bytes
  fileType: varchar("fileType", { length: 50 }), // jpg, png, zip, raw, etc.
  displayOrder: int("displayOrder").default(0).notNull(), // for reordering
  isDeleted: boolean("isDeleted").default(false).notNull(), // soft delete
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type BookingPhoto = typeof bookingPhotos.$inferSelect;
export type InsertBookingPhoto = typeof bookingPhotos.$inferInsert;




/**
 * Photographer payouts / withdrawals
 */
export const payouts = mysqlTable("payouts", {
  id: int("id").autoincrement().primaryKey(),
  photographerId: int("photographerId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"])
    .default("pending")
    .notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), // stripe_connect, bank_transfer, etc.
  stripePayoutId: varchar("stripePayoutId", { length: 255 }), // Stripe payout ID for tracking
  failureReason: text("failureReason"), // reason if status = failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = typeof payouts.$inferInsert;


/**
 * Photographer applications for new photographers
 */
export const photographerApplications = mysqlTable("photographer_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  yearsExperience: int("yearsExperience"),
  equipmentUsed: text("equipmentUsed"),
  governmentIdUrl: varchar("governmentIdUrl", { length: 500 }),
  governmentIdType: varchar("governmentIdType", { length: 50 }), // driver_license, passport, etc.
  independentContractorAgreed: boolean("independentContractorAgreed").default(false).notNull(),
  termsOfServiceAgreed: boolean("termsOfServiceAgreed").default(false).notNull(),
  status: mysqlEnum("status", ["pending", "under_review", "approved", "rejected", "more_info_required"])
    .default("pending")
    .notNull(),
  adminNotes: text("adminNotes"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PhotographerApplication = typeof photographerApplications.$inferSelect;
export type InsertPhotographerApplication = typeof photographerApplications.$inferInsert;

/**
 * Photographer portfolio photos for applications
 */
export const photographerPortfolios = mysqlTable("photographer_portfolios", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  photoUrl: varchar("photoUrl", { length: 500 }).notNull(),
  photoDescription: varchar("photoDescription", { length: 255 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PhotographerPortfolio = typeof photographerPortfolios.$inferSelect;
export type InsertPhotographerPortfolio = typeof photographerPortfolios.$inferInsert;


/**
 * Waitlist for areas where photographers are not yet available
 */
export const waitlist = mysqlTable("waitlist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zipCode: varchar("zipCode", { length: 10 }),
  latitude: float("latitude"),
  longitude: float("longitude"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = typeof waitlist.$inferInsert;


/**
 * Internal editor ratings for photographer quality control
 * Only visible to photographers and admins
 */
export const editorRatings = mysqlTable("editor_ratings", {
  id: int("id").autoincrement().primaryKey(),
  bookingCode: varchar("bookingCode", { length: 50 }).notNull(),
  bookingId: int("bookingId").notNull(),
  photographerId: int("photographerId").notNull(),
  editorId: int("editorId").notNull(),
  overallRating: int("overallRating").notNull(), // 1-5
  photoQualityRating: int("photoQualityRating").notNull(), // 1-5
  fileOrganizationRating: int("fileOrganizationRating").notNull(), // 1-5
  instructionRating: int("instructionRating").notNull(), // 1-5
  editingEaseRating: int("editingEaseRating").notNull(), // 1-5
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EditorRating = typeof editorRatings.$inferSelect;
export type InsertEditorRating = typeof editorRatings.$inferInsert;

/**
 * Photographer uploaded documents for compliance
 */
export const photographerDocuments = mysqlTable("photographer_documents", {
  id: int("id").autoincrement().primaryKey(),
  photographerId: int("photographerId").notNull(),
  documentType: mysqlEnum("documentType", [
    "government_id",
    "driver_license",
    "passport",
    "w9_form",
    "faa_license",
    "insurance_certificate"
  ]).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  verificationNotes: text("verificationNotes"),
  expiresAt: timestamp("expiresAt"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PhotographerDocument = typeof photographerDocuments.$inferSelect;
export type InsertPhotographerDocument = typeof photographerDocuments.$inferInsert;

/**
 * Photographer agreement acceptance tracking
 */
export const photographerAgreements = mysqlTable("photographer_agreements", {
  id: int("id").autoincrement().primaryKey(),
  photographerId: int("photographerId").notNull(),
  agreementType: mysqlEnum("agreementType", [
    "independent_contractor",
    "photo_ownership",
    "confidentiality",
    "quality_standards",
    "cancellation_policy",
    "data_protection",
    "ai_usage",
    "drone_faa"
  ]).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  agreementVersion: varchar("agreementVersion", { length: 10 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PhotographerAgreement = typeof photographerAgreements.$inferSelect;
export type InsertPhotographerAgreement = typeof photographerAgreements.$inferInsert;

/**
 * Photographer compliance status and violations
 */
export const photographerCompliance = mysqlTable("photographer_compliance", {
  id: int("id").autoincrement().primaryKey(),
  photographerId: int("photographerId").notNull(),
  complianceStatus: mysqlEnum("complianceStatus", [
    "compliant",
    "warning",
    "suspended",
    "banned"
  ]).default("compliant").notNull(),
  cancellationCount: int("cancellationCount").default(0),
  missedBookingCount: int("missedBookingCount").default(0),
  qualityWarnings: int("qualityWarnings").default(0),
  lastViolationAt: timestamp("lastViolationAt"),
  violationReason: text("violationReason"),
  suspensionEndDate: timestamp("suspensionEndDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PhotographerCompliance = typeof photographerCompliance.$inferSelect;
export type InsertPhotographerCompliance = typeof photographerCompliance.$inferInsert;


/**
 * User notification and preference settings
 */
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  smsNotifications: boolean("smsNotifications").default(false).notNull(),
  pushNotifications: boolean("pushNotifications").default(true).notNull(),
  bookingAlerts: boolean("bookingAlerts").default(true).notNull(),
  weeklyDigest: boolean("weeklyDigest").default(false).notNull(),
  language: varchar("language", { length: 10 }).default("en").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  dataCollection: boolean("dataCollection").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Platform-wide system settings (admin-controlled)
 */
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
