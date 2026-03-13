# PHASE 2 - CLEAN SITE MAP
**Official Route Architecture for Snapty Application**

**Date:** 2026-03-12  
**Status:** PHASE 2 DELIVERABLE - AWAITING APPROVAL  
**Total Official Routes:** 48 routes  
**Legacy Routes to Redirect:** 8 routes  
**Routes to Remove:** 0 routes

---

## OFFICIAL ROUTE STRUCTURE

### 🌐 PUBLIC ROUTES (7 routes)

| Route | Section | Access Role | Auth Required | Status | Component | Purpose |
|-------|---------|-------------|----------------|--------|-----------|----------|
| `/` | Public | All | No | **OFFICIAL** | SplashScreen | Landing page / home |
| `/login` | Public | All | No | **OFFICIAL** | Login | Unified public login (client + photographer) |
| `/signup` | Public | All | No | **OFFICIAL** | Login | Public signup (client + photographer) |
| `/for-clients` | Public | All | No | **OFFICIAL** | ClientLanding | Client landing page |
| `/for-photographers` | Public | All | No | **OFFICIAL** | PhotographerLandingPage | Photographer landing page |
| `/admin/login` | Admin | Admin | No | **OFFICIAL** | AdminLogin | Admin-only login |
| `/404` | Public | All | No | **OFFICIAL** | NotFound | 404 error page |

---

### 👥 CLIENT ROUTES (22 routes)

#### Main Dashboard & Navigation
| Route | Section | Access Role | Auth Required | Status | Component | Purpose |
|-------|---------|-------------|----------------|--------|-----------|----------|
| `/client` | Client | Client | Yes | **OFFICIAL** | ClientDashboard | Main client dashboard |
| `/client/bookings` | Client | Client | Yes | **OFFICIAL** | ClientBookings | List of client bookings |
| `/client/booking/:bookingCode` | Client | Client | Yes | **OFFICIAL** | BookingDetails | Individual booking details |
| `/client/gallery/:bookingCode` | Client | Client | Yes | **OFFICIAL** | ClientGallery | Photo gallery for completed booking |
| `/client/profile` | Client | Client | Yes | **OFFICIAL** | ClientProfile | Client profile management (NEW) |
| `/client/settings` | Client | Client | Yes | **OFFICIAL** | ClientSettings | Client settings (NEW) |
| `/client/notifications` | Client | Client | Yes | **OFFICIAL** | ClientNotifications | Client notifications (NEW) |

#### Booking Flow - Unified Under `/client/book/...`
| Route | Section | Access Role | Auth Required | Status | Component | Purpose |
|-------|---------|-------------|----------------|--------|-----------|----------|
| `/client/book/start` | Client Booking | Client | Yes | **OFFICIAL** | ServiceSelection | Select services (step 1) |
| `/client/book/property` | Client Booking | Client | Yes | **OFFICIAL** | PropertyDetails | Enter property details (step 2) |
| `/client/book/schedule` | Client Booking | Client | Yes | **OFFICIAL** | DateTimeSelection | Select date and time (step 3) |
| `/client/book/photographers` | Client Booking | Client | Yes | **OFFICIAL** | PhotographersList | Browse photographers (step 4) |
| `/client/book/photographer/:id` | Client Booking | Client | Yes | **OFFICIAL** | PhotographerProfilePage | View photographer profile (step 4b) |
| `/client/book/addons` | Client Booking | Client | Yes | **OFFICIAL** | BookingAddons | Select add-ons (step 5a) (NEW) |
| `/client/book/review` | Client Booking | Client | Yes | **OFFICIAL** | CompleteBookingFlow | Review booking summary (step 5b) |
| `/client/book/payment` | Client Booking | Client | Yes | **OFFICIAL** | ClientPayment | Payment page (step 6) |
| `/client/book/confirmation/:bookingCode` | Client Booking | Client | Yes | **OFFICIAL** | BookingConfirmation | Booking confirmation (step 7) |

---

### 📸 PHOTOGRAPHER ROUTES (18 routes)

#### Entry Points
| Route | Section | Access Role | Auth Required | Status | Component | Purpose |
|-------|---------|-------------|----------------|--------|-----------|---------|
| `/photographer/login` | Photographer | Photographer | No | **OFFICIAL** | Login | Photographer login |
| `/photographer/apply` | Photographer | Photographer | No | **OFFICIAL** | PhotographerApply | Apply to become photographer |
| `/photographer/onboarding` | Photographer | Photographer | No | **OFFICIAL** | PhotographerOnboarding | Photographer onboarding flow |

#### Main Dashboard & Navigation
| Route | Section | Access Role | Auth Required | Status | Component | Purpose |
|-------|---------|-------------|----------------|--------|-----------|---------|
| `/photographer` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerDashboard | Main photographer dashboard (hub) |
| `/photographer/requests` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerDashboard | Booking requests tab (part of dashboard) |
| `/photographer/profile` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerDashboard | Profile tab (part of dashboard) |
| `/photographer/bookings` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerDashboard | Bookings tab (part of dashboard) |
| `/photographer/portfolio` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerDashboard | Portfolio tab (part of dashboard) |

#### Specific Features
| Route | Section | Access Role | Auth Required | Status | Component | Purpose |
|-------|---------|-------------|----------------|--------|-----------|----------|
| `/photographer/booking/:bookingCode` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerBookingDetails | Individual booking details |
| `/photographer/calendar` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerCalendar | Calendar view |
| `/photographer/guidelines` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerGuidelines | Training guidelines |
| `/photographer/earnings` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerEarnings | Earnings dashboard |
| `/photographer/payouts` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerPayouts | Payout history |
| `/photographer/payout-settings` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerPayoutSettings | Payout configuration |
| `/photographer/settings` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerSettings | Photographer settings (NEW) |
| `/photographer/notifications` | Photographer | Photographer | Yes | **OFFICIAL** | PhotographerNotifications | Photographer notifications (NEW) |

---

### 🔐 ADMIN ROUTES (12 routes)



#### Main Dashboard & Management
| Route | Section | Access Role | Auth Required | Status | Component | Purpose |
|-------|---------|-------------|----------------|--------|-----------|----------|
| `/admin` | Admin | Admin | Yes | **OFFICIAL** | AdminDashboard | Main admin dashboard |
| `/admin/bookings` | Admin | Admin | Yes | **OFFICIAL** | AdminBookings | Manage bookings (NEW) |
| `/admin/photographers` | Admin | Admin | Yes | **OFFICIAL** | AdminPhotographers | Manage photographers (NEW) |
| `/admin/clients` | Admin | Admin | Yes | **OFFICIAL** | AdminClients | Manage clients (NEW) |
| `/admin/payouts` | Admin | Admin | Yes | **OFFICIAL** | AdminPayouts | Manage payouts (NEW) |
| `/admin/disputes` | Admin | Admin | Yes | **OFFICIAL** | AdminDisputes | Manage disputes (NEW) |
| `/admin/reports` | Admin | Admin | Yes | **OFFICIAL** | AdminReports | View reports (NEW) |
| `/admin/reviews` | Admin | Admin | Yes | **OFFICIAL** | AdminReviews | Manage reviews (NEW) |
| `/admin/system` | Admin | Admin | Yes | **OFFICIAL** | AdminSystem | System settings (NEW) |
| `/admin/settings` | Admin | Admin | Yes | **OFFICIAL** | AdminSettings | Admin settings (NEW) |

---

## LEGACY ROUTES CLASSIFICATION

### Routes to REDIRECT (Keep for backward compatibility)
| Old Route | Redirects To | Reason | Status |
|-----------|-------------|--------|--------|
| `/home` | `/` | Legacy home route | **REDIRECT** |
| `/client/home` | `/client` | Redundant with dashboard | **REDIRECT** |
| `/client/login` | `/login` | Use unified login | **REDIRECT** |
| `/client/signup` | `/login` | Use unified signup | **REDIRECT** |
| `/photographer/signup` | `/photographer/onboarding` | Use official onboarding | **REDIRECT** |
| `/onboarding` | `/photographer/onboarding` | Use namespaced route | **REDIRECT** |
| `/admin/dashboard` | `/admin` | Use official admin route | **REDIRECT** |
| `/client/map` | `/client/book/photographers` | Consolidate map routes | **REDIRECT** |

### Routes to CONSOLIDATE (Merge into official)
| Old Route | Consolidates Into | Reason | Status |
|-----------|------------------|--------|--------|
| `/client/photographer-map` | `/client/book/photographers` | Duplicate map route | **MERGE** |
| `/client/photographers` | `/client/book/photographers` | Duplicate photographers list | **MERGE** |
| `/booking/:photographerId` | `/client/book/review` | Root-level booking flow | **MERGE** |
| `/complete-booking-flow` | `/client/book/review` | Duplicate review step | **MERGE** |
| `/client/booking-confirmation/:bookingCode` | `/client/book/confirmation/:bookingCode` | Namespace correction | **MERGE** |
| `/booking-confirmation/:bookingCode` | `/client/book/confirmation/:bookingCode` | Root-level duplicate | **MERGE** |
| `/client/booking-details/:bookingCode` | `/client/booking/:bookingCode` | Naming simplification | **MERGE** |
| `/client/property-details` | `/client/book/property` | Namespace correction | **MERGE** |
| `/client/service-selection` | `/client/book/start` | Namespace correction | **MERGE** |
| `/client/date-time` | `/client/book/schedule` | Namespace correction | **MERGE** |
| `/client/payment` | `/client/book/payment` | Namespace correction | **MERGE** |

---

## COMPONENT OWNERSHIP CLARIFICATION

### PhotographerDashboardNew - CLARIFIED AS TABBED DASHBOARD

**Decision:** Keep as one dashboard component with multiple tabs/sections

**Routes Using This Component:**
- `/photographer` → Main dashboard (hub)
- `/photographer/requests` → Requests tab
- `/photographer/profile` → Profile tab
- `/photographer/bookings` → Bookings tab
- `/photographer/portfolio` → Portfolio tab

**Implementation Detail:** The component will use URL-based tab routing where the path indicates which tab is active. This is a tabbed dashboard pattern, not separate pages.

**Rationale:** 
- Reduces component duplication
- Provides consistent UX with shared header/nav
- Easier state management
- Clear navigation between related sections

---

### Login Component - CLARIFIED AS UNIFIED LOGIN

**Decision:** Unified login for client + photographer; separate admin login

**Routes Using This Component:**
- `/login` → Unified login for client and photographer
- `/admin/login` → Admin-only login (separate component)

**Implementation Detail:** 
- `/login` component detects user role and shows appropriate UI/messaging
- `/admin/login` is separate to maintain admin security boundary
- `/photographer/login` and `/client/login` redirect to `/login`

**Rationale:**
- Reduces code duplication for client/photographer
- Maintains admin security boundary
- Consistent login experience for regular users

---

## BOOKING FLOW ARCHITECTURE

### Official Booking Flow Path
```
/client/book/start
  ↓ (Select services)
/client/book/property
  ↓ (Enter property details)
/client/book/schedule
  ↓ (Select date/time)
/client/book/photographers
  ↓ (Browse photographers)
/client/book/photographer/:id
  ↓ (View photographer profile)
/client/book/review
  ↓ (Review booking summary)
/client/book/payment
  ↓ (Process payment)
/client/book/confirmation/:bookingCode
  ↓ (Confirmation)
/client/booking/:bookingCode (Post-booking access)
/client/gallery/:bookingCode (Photo gallery)
```

### Key Decisions:
1. ✅ All booking flow routes under `/client/book/` namespace
2. ✅ Clear step-by-step progression
3. ✅ No escaping to root-level routes
4. ✅ Post-booking routes separate from flow
5. ✅ Consistent naming convention

---

## ADMIN STRUCTURE ARCHITECTURE

### Official Admin Routes
```
/admin/login → Admin authentication
/admin → Main dashboard (overview)
  ├── /admin/bookings → Booking management
  ├── /admin/photographers → Photographer management
  ├── /admin/clients → Client management
  ├── /admin/payouts → Payout management
  ├── /admin/disputes → Dispute resolution
  └── /admin/settings → Admin settings
```

### Implementation Notes:
- All admin pages except `/admin/login` require admin role authentication
- Pages marked (NEW) are not yet implemented but are defined in the architecture
- Admin dashboard will have sidebar navigation to all management pages

---

## AUTHENTICATION & ACCESS CONTROL

### Public Routes (No Auth Required)
```
/
/login
/signup
/for-clients
/for-photographers
/photographer/login
/photographer/apply
/photographer/onboarding
/admin/login
/404
```

### Protected Client Routes (Auth + Client Role Required)
```
/client/*
/client/book/*
```

### Protected Photographer Routes (Auth + Photographer Role Required)
```
/photographer/* (except login/apply/onboarding)
```

### Protected Admin Routes (Auth + Admin Role Required)
```
/admin/* (except /admin/login)
```

---

## ROUTE SUMMARY STATISTICS

| Category | Count | Status |
|----------|-------|--------|
| Official Routes | 48 | ✅ Active |
| Legacy Redirects | 8 | ⚠️ Backward Compatibility |
| Routes to Consolidate | 11 | ⚠️ Merging into Official |
| Routes to Remove | 0 | ✅ None |
| New Routes (Planned) | 15 | 📋 Not Yet Implemented |
| **Total Unique Routes** | **48** | **Official** |

---

## MIGRATION SUMMARY

### Removed from Official Routes
- None (all legacy routes preserved as redirects)

### Added to Official Routes
- `/client` (main dashboard)
- `/client/profile` (NEW)
- `/client/settings` (NEW)
- `/client/book/*` (8 booking flow routes)
- `/admin/bookings` (NEW)
- `/admin/photographers` (NEW)
- `/admin/clients` (NEW)
- `/admin/payouts` (NEW)
- `/admin/disputes` (NEW)
- `/admin/settings` (NEW)

### Reorganized Routes
- `/client/service-selection` → `/client/book/start`
- `/client/property-details` → `/client/book/property`
- `/client/date-time` → `/client/book/schedule`
- `/client/photographers` → `/client/book/photographers`
- `/client/photographer/:id` → `/client/book/photographer/:id`
- `/booking/:photographerId` → `/client/book/review`
- `/complete-booking-flow` → `/client/book/review`
- `/client/payment` → `/client/book/payment`
- `/client/booking-confirmation/:bookingCode` → `/client/book/confirmation/:bookingCode`
- `/booking-confirmation/:bookingCode` → `/client/book/confirmation/:bookingCode`
- `/client/booking-details/:bookingCode` → `/client/booking/:bookingCode`

### Redirected for Backward Compatibility
- `/home` → `/`
- `/client/home` → `/client`
- `/client/login` → `/login`
- `/client/signup` → `/login`
- `/photographer/signup` → `/photographer/onboarding`
- `/onboarding` → `/photographer/onboarding`
- `/admin/dashboard` → `/admin`
- `/client/map` → `/client/book/photographers`

---

## NEXT STEPS (AWAITING APPROVAL)

### PHASE 2 COMPLETE ✓
This clean site map is complete with all official route decisions.

### PHASE 3 READY (Awaiting Approval)
Once approved, I will create the ROUTE_MIGRATION_PLAN.md with detailed implementation steps.

---

**CLEAN_SITE_MAP.md COMPLETE - AWAITING USER APPROVAL BEFORE PROCEEDING**
