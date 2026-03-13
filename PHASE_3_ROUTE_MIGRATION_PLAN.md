# PHASE 3 - ROUTE MIGRATION PLAN (UPDATED)
**Detailed Migration Steps for Snapty Route Architecture Refactor**

**Date:** 2026-03-12  
**Status:** PHASE 3 DELIVERABLE - APPROVED MODIFICATIONS APPLIED  
**Total Routes Affected:** 35 routes

---

## MIGRATION OVERVIEW

This document provides step-by-step migration instructions for every route change needed to transform the current routing architecture into the clean, production-safe architecture defined in the approved CLEAN_SITE_MAP.md.

**Total Migration Items:** 35 routes affected
- Redirects: 8 routes
- Consolidations: 11 routes
- New Routes: 15 routes
- Unchanged: 21 routes

---

## CATEGORY 1: UNIFIED LOGIN STRATEGY

### New Login Architecture
**Decision:** Unified login for client + photographer; separate admin login

#### 1.1 `/login` - Unified Login (Updated)
| Property | Value |
|----------|-------|
| Old Route | `/login` (existing) |
| New Route | `/login` (same) |
| Action Type | **UPDATE** |
| Current Component | Login |
| Changes | Enhance to detect client vs photographer and show appropriate UI |
| Implementation | Update Login component to show role selection or detect from referrer |
| Risk Notes | Low - existing route, just enhanced |
| Testing | Verify both client and photographer can login |
| Notes | Consolidates `/photographer/login` and `/client/login` |

#### 1.2 `/photographer/login` → `/login`
| Property | Value |
|----------|-------|
| Old Route | `/photographer/login` |
| New Route | `/login` |
| Action Type | **REDIRECT** |
| Current Component | Login |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/photographer/login" component={() => <Navigate to="/login" />}` |
| Risk Notes | Low - photographer-specific login becomes generic |
| Testing | Verify `/photographer/login` redirects to `/login` |
| Notes | Part of unified login strategy |

#### 1.3 `/client/login` → `/login`
| Property | Value |
|----------|-------|
| Old Route | `/client/login` |
| New Route | `/login` |
| Action Type | **REDIRECT** |
| Current Component | Login |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/client/login" component={() => <Navigate to="/login" />}` |
| Risk Notes | Low - client-specific login becomes generic |
| Testing | Verify `/client/login` redirects to `/login` |
| Notes | Part of unified login strategy |

#### 1.4 `/admin/login` - Admin-Only Login (NEW)
| Property | Value |
|----------|-------|
| Old Route | `/admin/login` (existing) |
| New Route | `/admin/login` (same) |
| Action Type | **KEEP** |
| Current Component | AdminLogin |
| Changes | None - keep separate for security |
| Implementation | No changes needed |
| Risk Notes | None |
| Testing | Verify admin login works separately |
| Notes | Maintains admin security boundary |

---

## CATEGORY 2: NEW CLIENT ROUTES (3 routes)

#### 2.1 `/client/notifications` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/client/notifications` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | ClientNotifications (NEW) |
| Redirect Needed? | No |
| Implementation | Create new ClientNotifications component for notification management |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 2.2 `/client/profile` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/client/profile` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | ClientProfile (NEW) |
| Redirect Needed? | No |
| Implementation | Create new ClientProfile component for profile management |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 2.3 `/client/settings` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/client/settings` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | ClientSettings (NEW) |
| Redirect Needed? | No |
| Implementation | Create new ClientSettings component for settings management |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

---

## CATEGORY 3: NEW BOOKING FLOW ROUTE (1 route)

#### 3.1 `/client/book/addons` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/client/book/addons` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | BookingAddons (NEW) |
| Redirect Needed? | No |
| Implementation | Create new BookingAddons component for add-on selection (step 5a) |
| Risk Notes | None - new route |
| Testing | Verify add-ons display correctly in booking flow |
| Notes | Inserted between photographer selection and review |
| Booking Flow Impact | Updates flow: photographers → addons → review → payment |

---

## CATEGORY 4: NEW PHOTOGRAPHER ROUTES (2 routes)

#### 4.1 `/photographer/settings` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/photographer/settings` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | PhotographerSettings (NEW) |
| Redirect Needed? | No |
| Implementation | Create new PhotographerSettings component for photographer settings |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 4.2 `/photographer/notifications` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/photographer/notifications` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | PhotographerNotifications (NEW) |
| Redirect Needed? | No |
| Implementation | Create new PhotographerNotifications component for notifications |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

---

## CATEGORY 5: NEW ADMIN ROUTES (9 routes)

#### 5.1 `/admin/bookings` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/admin/bookings` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | AdminBookings (NEW) |
| Redirect Needed? | No |
| Implementation | Create new AdminBookings component for booking management |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 5.2 `/admin/photographers` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/admin/photographers` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | AdminPhotographers (NEW) |
| Redirect Needed? | No |
| Implementation | Create new AdminPhotographers component for photographer management |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 5.3 `/admin/clients` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/admin/clients` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | AdminClients (NEW) |
| Redirect Needed? | No |
| Implementation | Create new AdminClients component for client management |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 5.4 `/admin/payouts` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/admin/payouts` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | AdminPayouts (NEW) |
| Redirect Needed? | No |
| Implementation | Create new AdminPayouts component for payout management |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 5.5 `/admin/disputes` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/admin/disputes` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | AdminDisputes (NEW) |
| Redirect Needed? | No |
| Implementation | Create new AdminDisputes component for dispute management |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 5.6 `/admin/reports` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/admin/reports` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | AdminReports (NEW) |
| Redirect Needed? | No |
| Implementation | Create new AdminReports component for reporting |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 5.7 `/admin/reviews` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/admin/reviews` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | AdminReviews (NEW) |
| Redirect Needed? | No |
| Implementation | Create new AdminReviews component for review management |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 5.8 `/admin/system` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/admin/system` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | AdminSystem (NEW) |
| Redirect Needed? | No |
| Implementation | Create new AdminSystem component for system settings |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

#### 5.9 `/admin/settings` (NEW)
| Property | Value |
|----------|-------|
| Old Route | N/A (NEW) |
| New Route | `/admin/settings` |
| Action Type | **CREATE** |
| Current Component | None (NEW) |
| New Component | AdminSettings (NEW) |
| Redirect Needed? | No |
| Implementation | Create new AdminSettings component for admin settings |
| Risk Notes | None - new route |
| Testing | Verify route accessible and component renders |
| Notes | Deferred to future phase |

---

## CATEGORY 6: LEGACY ROUTES TO REDIRECT (8 routes)

These routes will be kept but will redirect to their official equivalents for backward compatibility.

#### 6.1 `/home` → `/`
| Property | Value |
|----------|-------|
| Old Route | `/home` |
| New Route | `/` |
| Action Type | **REDIRECT** |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/home" component={() => <Navigate to="/" />}` |
| Risk Notes | Low - legacy route |
| Testing | Verify `/home` redirects to `/` |

#### 6.2 `/client/home` → `/client`
| Property | Value |
|----------|-------|
| Old Route | `/client/home` |
| New Route | `/client` |
| Action Type | **REDIRECT** |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/client/home" component={() => <Navigate to="/client" />}` |
| Risk Notes | Medium - clients may have bookmarked |
| Testing | Verify `/client/home` redirects to `/client` |

#### 6.3 `/client/signup` → `/login`
| Property | Value |
|----------|-------|
| Old Route | `/client/signup` |
| New Route | `/login` |
| Action Type | **REDIRECT** |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/client/signup" component={() => <Navigate to="/login" />}` |
| Risk Notes | Low - internal route |
| Testing | Verify `/client/signup` redirects to `/login` |

#### 6.4 `/photographer/signup` → `/photographer/onboarding`
| Property | Value |
|----------|-------|
| Old Route | `/photographer/signup` |
| New Route | `/photographer/onboarding` |
| Action Type | **REDIRECT** |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/photographer/signup" component={() => <Navigate to="/photographer/onboarding" />}` |
| Risk Notes | Low - both point to same component |
| Testing | Verify `/photographer/signup` redirects correctly |

#### 6.5 `/onboarding` → `/photographer/onboarding`
| Property | Value |
|----------|-------|
| Old Route | `/onboarding` |
| New Route | `/photographer/onboarding` |
| Action Type | **REDIRECT** |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/onboarding" component={() => <Navigate to="/photographer/onboarding" />}` |
| Risk Notes | Low - root-level route |
| Testing | Verify `/onboarding` redirects correctly |

#### 6.6 `/admin/dashboard` → `/admin`
| Property | Value |
|----------|-------|
| Old Route | `/admin/dashboard` |
| New Route | `/admin` |
| Action Type | **REDIRECT** |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/admin/dashboard" component={() => <Navigate to="/admin" />}` |
| Risk Notes | Low - internal admin route |
| Testing | Verify `/admin/dashboard` redirects correctly |

#### 6.7 `/client/map` → `/client/book/photographers`
| Property | Value |
|----------|-------|
| Old Route | `/client/map` |
| New Route | `/client/book/photographers` |
| Action Type | **REDIRECT** |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/client/map" component={() => <Navigate to="/client/book/photographers" />}` |
| Risk Notes | Medium - map route may be used in links |
| Testing | Verify `/client/map` redirects correctly |

#### 6.8 `/photographer/login` → `/login`
| Property | Value |
|----------|-------|
| Old Route | `/photographer/login` |
| New Route | `/login` |
| Action Type | **REDIRECT** |
| Redirect Needed? | **YES** |
| Implementation | Add redirect: `<Route path="/photographer/login" component={() => <Navigate to="/login" />}` |
| Risk Notes | Low - part of unified login |
| Testing | Verify `/photographer/login` redirects to `/login` |

---

## CATEGORY 7: ROUTES TO CONSOLIDATE (11 routes)

These routes will be merged into official routes. Old routes will be removed and replaced with new ones.

#### 7.1 `/client/photographer-map` → `/client/book/photographers`
| Property | Value |
|----------|-------|
| Old Route | `/client/photographer-map` |
| New Route | `/client/book/photographers` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/photographers`<br/>2. Add redirect from old route |
| Risk Notes | Medium - component needs enhancement |

#### 7.2 `/client/photographers` → `/client/book/photographers`
| Property | Value |
|----------|-------|
| Old Route | `/client/photographers` |
| New Route | `/client/book/photographers` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/photographers`<br/>2. Add redirect from old route |
| Risk Notes | Low - same component |

#### 7.3 `/client/photographer/:id` → `/client/book/photographer/:id`
| Property | Value |
|----------|-------|
| Old Route | `/client/photographer/:id` |
| New Route | `/client/book/photographer/:id` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/photographer/:id`<br/>2. Add redirect from old route |
| Risk Notes | Medium - external links may reference old route |

#### 7.4 `/booking/:photographerId` → `/client/book/review`
| Property | Value |
|----------|-------|
| Old Route | `/booking/:photographerId` |
| New Route | `/client/book/review` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/review`<br/>2. Add redirect from old route<br/>3. Update component to work without :photographerId param |
| Risk Notes | High - root-level route, may have external references |

#### 7.5 `/complete-booking-flow` → `/client/book/review`
| Property | Value |
|----------|-------|
| Old Route | `/complete-booking-flow` |
| New Route | `/client/book/review` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/review`<br/>2. Add redirect from old route |
| Risk Notes | Low - internal route |

#### 7.6 `/client/booking-confirmation/:bookingCode` → `/client/book/confirmation/:bookingCode`
| Property | Value |
|----------|-------|
| Old Route | `/client/booking-confirmation/:bookingCode` |
| New Route | `/client/book/confirmation/:bookingCode` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/confirmation/:bookingCode`<br/>2. Add redirect from old route |
| Risk Notes | Medium - confirmation URL may be shared |

#### 7.7 `/booking-confirmation/:bookingCode` → `/client/book/confirmation/:bookingCode`
| Property | Value |
|----------|-------|
| Old Route | `/booking-confirmation/:bookingCode` |
| New Route | `/client/book/confirmation/:bookingCode` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Remove root-level route<br/>2. Add redirect to new route |
| Risk Notes | High - root-level route may have external references |

#### 7.8 `/client/booking-details/:bookingCode` → `/client/booking/:bookingCode`
| Property | Value |
|----------|-------|
| Old Route | `/client/booking-details/:bookingCode` |
| New Route | `/client/booking/:bookingCode` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Rename route to `/client/booking/:bookingCode`<br/>2. Add redirect from old route |
| Risk Notes | Medium - booking details URL may be shared |

#### 7.9 `/client/property-details` → `/client/book/property`
| Property | Value |
|----------|-------|
| Old Route | `/client/property-details` |
| New Route | `/client/book/property` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/property`<br/>2. Add redirect from old route |
| Risk Notes | Low - internal booking flow route |

#### 7.10 `/client/service-selection` → `/client/book/start`
| Property | Value |
|----------|-------|
| Old Route | `/client/service-selection` |
| New Route | `/client/book/start` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/start`<br/>2. Add redirect from old route |
| Risk Notes | Low - internal booking flow route |

#### 7.11 `/client/date-time` → `/client/book/schedule`
| Property | Value |
|----------|-------|
| Old Route | `/client/date-time` |
| New Route | `/client/book/schedule` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/schedule`<br/>2. Add redirect from old route |
| Risk Notes | Low - internal booking flow route |

#### 7.12 `/client/payment` → `/client/book/payment`
| Property | Value |
|----------|-------|
| Old Route | `/client/payment` |
| New Route | `/client/book/payment` |
| Action Type | **CONSOLIDATE** |
| Implementation | 1. Move route to `/client/book/payment`<br/>2. Add redirect from old route |
| Risk Notes | Low - internal booking flow route |

---

## UPDATED BOOKING FLOW

### New Booking Flow Path
```
/client/book/start (Services)
  ↓
/client/book/property (Property Details)
  ↓
/client/book/schedule (Date/Time)
  ↓
/client/book/photographers (Browse Photographers)
  ↓
/client/book/photographer/:id (View Photographer)
  ↓
/client/book/addons (Select Add-ons) ← NEW STEP
  ↓
/client/book/review (Review Summary)
  ↓
/client/book/payment (Payment)
  ↓
/client/book/confirmation/:bookingCode (Confirmation)
  ↓
/client/booking/:bookingCode (Post-booking access)
/client/gallery/:bookingCode (Photo gallery)
```

---

## IMPLEMENTATION PRIORITY

### Phase 3A - Critical (Must Do First)
1. Add redirect routes (8 routes)
2. Move booking flow routes to `/client/book/` namespace (8 routes)
3. Consolidate map routes (2 routes)
4. Update router structure
5. Update unified login strategy

### Phase 3B - Important (Do After 3A)
1. Create new admin routes (9 routes)
2. Create new photographer routes (2 routes)
3. Create new client routes (3 routes)
4. Create new booking flow route (1 route)
5. Update navigation links throughout app

### Phase 3C - Optional (Nice to Have)
1. Remove old route definitions from code
2. Update internal links to use new routes
3. Update documentation

---

## TESTING CHECKLIST

### Login Routes
- [ ] `/login` loads unified login
- [ ] `/photographer/login` redirects to `/login`
- [ ] `/client/login` redirects to `/login`
- [ ] `/admin/login` loads admin login (separate)

### Redirect Routes
- [ ] `/home` redirects to `/`
- [ ] `/client/home` redirects to `/client`
- [ ] `/client/signup` redirects to `/login`
- [ ] `/photographer/signup` redirects to `/photographer/onboarding`
- [ ] `/onboarding` redirects to `/photographer/onboarding`
- [ ] `/admin/dashboard` redirects to `/admin`
- [ ] `/client/map` redirects to `/client/book/photographers`

### Booking Flow Routes
- [ ] `/client/book/start` loads ServiceSelection
- [ ] `/client/book/property` loads PropertyDetails
- [ ] `/client/book/schedule` loads DateTimeSelection
- [ ] `/client/book/photographers` loads PhotographersList
- [ ] `/client/book/photographer/:id` loads PhotographerProfilePage
- [ ] `/client/book/addons` loads BookingAddons (NEW)
- [ ] `/client/book/review` loads CompleteBookingFlow
- [ ] `/client/book/payment` loads ClientPayment
- [ ] `/client/book/confirmation/:bookingCode` loads BookingConfirmation

### New Routes
- [ ] `/client/notifications` accessible
- [ ] `/client/profile` accessible
- [ ] `/client/settings` accessible
- [ ] `/photographer/settings` accessible
- [ ] `/photographer/notifications` accessible
- [ ] All admin routes accessible

---

## NEXT STEPS (AWAITING APPROVAL)

### PHASE 3 READY (Awaiting Approval)
Once approved, I will implement the router refactor using this migration plan.

---

**PHASE_3_ROUTE_MIGRATION_PLAN.md COMPLETE - AWAITING USER APPROVAL BEFORE IMPLEMENTATION**
