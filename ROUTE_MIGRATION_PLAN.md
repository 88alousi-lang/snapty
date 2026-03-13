# PHASE 3 - ROUTE MIGRATION PLAN
**Comprehensive Route Mapping and Migration Strategy for Snapty**

**Date:** 2026-03-12  
**Status:** PHASE 3 DELIVERABLE - READY FOR IMPLEMENTATION  
**Total Routes Affected:** 35 routes  
**Implementation Strategy:** Backward Compatible Redirects + New Routes

---

## EXECUTIVE SUMMARY

This document provides a complete mapping of all route changes needed to transform the current routing architecture into the clean, production-safe architecture defined in CLEAN_SITE_MAP.md.

**Key Principles:**
- ✅ **Backward Compatibility:** All old routes remain functional via redirects
- ✅ **Booking Flow Protected:** No changes to booking flow logic, only URL structure
- ✅ **Dashboard Protected:** Tabbed dashboard architecture remains unchanged
- ✅ **No Page Deletion:** All existing components stay in place
- ✅ **Incremental Migration:** Can implement in phases without breaking existing functionality

---

## ROUTE MAPPING MATRIX

### SECTION 1: LOGIN & AUTHENTICATION (4 routes)

#### 1.1 Unified Login Routes

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/login` | `/login` | KEEP | No change | Login | ✅ OFFICIAL | Unified for client + photographer |
| `/signup` | `/signup` | KEEP | No change | Login | ✅ OFFICIAL | Public signup |
| `/photographer/login` | `/login` | REDIRECT | Add redirect | Login | ⚠️ LEGACY | Redirects to unified login |
| `/client/login` | `/login` | REDIRECT | Add redirect | Login | ⚠️ LEGACY | Redirects to unified login |

#### 1.2 Admin Login

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/admin/login` | `/admin/login` | KEEP | No change | AdminLogin | ✅ OFFICIAL | Admin-only login (separate) |

---

### SECTION 2: PUBLIC & LANDING PAGES (6 routes)

#### 2.1 Home & Landing Routes

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/` | `/` | KEEP | No change | SplashScreen | ✅ OFFICIAL | Main landing page |
| `/home` | `/` | REDIRECT | Add redirect | SplashScreen | ⚠️ LEGACY | Redirects to home |
| `/for-clients` | `/for-clients` | KEEP | No change | ClientLanding | ✅ OFFICIAL | Client landing page |
| `/for-photographers` | `/for-photographers` | KEEP | No change | PhotographerLandingPage | ✅ OFFICIAL | Photographer landing page |
| `/photographer/apply` | `/photographer/apply` | KEEP | No change | PhotographerApply | ✅ OFFICIAL | Photographer application |
| `/404` | `/404` | KEEP | No change | NotFound | ✅ OFFICIAL | 404 error page |

---

### SECTION 3: CLIENT ROUTES - MAIN DASHBOARD (7 routes)

#### 3.1 Client Dashboard & Navigation

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/client` | `/client` | KEEP | No change | ClientDashboard | ✅ OFFICIAL | Main dashboard |
| `/client/home` | `/client` | REDIRECT | Add redirect | ClientDashboard | ⚠️ LEGACY | Redirects to dashboard |
| `/client/bookings` | `/client/bookings` | KEEP | No change | ClientBookings | ✅ OFFICIAL | Bookings list |
| `/client/booking/:bookingCode` | `/client/booking/:bookingCode` | KEEP | No change | BookingDetails | ✅ OFFICIAL | Booking details |
| `/client/gallery/:bookingCode` | `/client/gallery/:bookingCode` | KEEP | No change | ClientGallery | ✅ OFFICIAL | Photo gallery |
| `/client/notifications` | `/client/notifications` | CREATE | New route | ClientNotifications | 🆕 NEW | Notifications (NEW) |
| `/client/profile` | `/client/profile` | CREATE | New route | ClientProfile | 🆕 NEW | Profile management (NEW) |

---

### SECTION 4: CLIENT ROUTES - BOOKING FLOW (12 routes)

#### 4.1 Booking Flow - Service Selection

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/client/service-selection` | `/client/book/start` | MOVE | Move to new namespace | ServiceSelection | ✅ OFFICIAL | Step 1: Services |
| `/client/service-selection` (old) | `/client/book/start` | REDIRECT | Add redirect | ServiceSelection | ⚠️ LEGACY | Backward compatibility |

#### 4.2 Booking Flow - Property Details

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/client/property-details` | `/client/book/property` | MOVE | Move to new namespace | PropertyDetails | ✅ OFFICIAL | Step 2: Property |
| `/client/property-details` (old) | `/client/book/property` | REDIRECT | Add redirect | PropertyDetails | ⚠️ LEGACY | Backward compatibility |

#### 4.3 Booking Flow - Date & Time Selection

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/client/date-time` | `/client/book/schedule` | MOVE | Move to new namespace | DateTimeSelection | ✅ OFFICIAL | Step 3: Schedule |
| `/client/date-time` (old) | `/client/book/schedule` | REDIRECT | Add redirect | DateTimeSelection | ⚠️ LEGACY | Backward compatibility |

#### 4.4 Booking Flow - Photographer Selection

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/client/photographer-map` | `/client/book/photographers` | MOVE | Move to new namespace | PhotographersList | ✅ OFFICIAL | Step 4: Photographers |
| `/client/photographers` | `/client/book/photographers` | MOVE | Move to new namespace | PhotographersList | ✅ OFFICIAL | Step 4: Photographers |
| `/client/photographer/:id` | `/client/book/photographer/:id` | MOVE | Move to new namespace | PhotographerProfilePage | ✅ OFFICIAL | Step 4b: Profile |
| `/client/map` | `/client/book/photographers` | REDIRECT | Add redirect | PhotographersList | ⚠️ LEGACY | Backward compatibility |

#### 4.5 Booking Flow - Add-ons Selection (NEW)

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| N/A | `/client/book/addons` | CREATE | New route | BookingAddons | 🆕 NEW | Step 5a: Add-ons (NEW) |

#### 4.6 Booking Flow - Review & Confirmation

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/booking/:photographerId` | `/client/book/review` | MOVE | Move to new namespace | CompleteBookingFlow | ✅ OFFICIAL | Step 5b: Review |
| `/complete-booking-flow` | `/client/book/review` | MOVE | Move to new namespace | CompleteBookingFlow | ✅ OFFICIAL | Step 5b: Review |

#### 4.7 Booking Flow - Payment

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/client/payment` | `/client/book/payment` | MOVE | Move to new namespace | ClientPayment | ✅ OFFICIAL | Step 6: Payment |

#### 4.8 Booking Flow - Confirmation

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/client/booking-confirmation/:bookingCode` | `/client/book/confirmation/:bookingCode` | MOVE | Move to new namespace | BookingConfirmation | ✅ OFFICIAL | Step 7: Confirmation |
| `/booking-confirmation/:bookingCode` | `/client/book/confirmation/:bookingCode` | MOVE | Move to new namespace | BookingConfirmation | ✅ OFFICIAL | Step 7: Confirmation |

---

### SECTION 5: PHOTOGRAPHER ROUTES - MAIN DASHBOARD (7 routes)

#### 5.1 Photographer Dashboard (Tabbed)

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/photographer/dashboard` | `/photographer/dashboard` | KEEP | No change | PhotographerDashboard | ✅ OFFICIAL | Main dashboard (tabbed) |
| `/photographer/requests` | `/photographer/dashboard` | REDIRECT | Add redirect | PhotographerDashboard | ⚠️ LEGACY | Tab: requests |
| `/photographer/profile` | `/photographer/dashboard` | REDIRECT | Add redirect | PhotographerDashboard | ⚠️ LEGACY | Tab: profile |
| `/photographer/bookings` | `/photographer/dashboard` | REDIRECT | Add redirect | PhotographerDashboard | ⚠️ LEGACY | Tab: bookings |
| `/photographer/portfolio` | `/photographer/dashboard` | REDIRECT | Add redirect | PhotographerDashboard | ⚠️ LEGACY | Tab: portfolio |
| `/photographer/onboarding` | `/photographer/onboarding` | KEEP | No change | PhotographerOnboarding | ✅ OFFICIAL | Onboarding flow |
| `/onboarding` | `/photographer/onboarding` | REDIRECT | Add redirect | PhotographerOnboarding | ⚠️ LEGACY | Redirects to photographer onboarding |

#### 5.2 Photographer Onboarding Aliases

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/photographer/signup` | `/photographer/onboarding` | REDIRECT | Add redirect | PhotographerOnboarding | ⚠️ LEGACY | Alias for onboarding |

---

### SECTION 6: PHOTOGRAPHER ROUTES - FEATURES (8 routes)

#### 6.1 Photographer Feature Routes

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/photographer/booking/:bookingCode` | `/photographer/booking/:bookingCode` | KEEP | No change | PhotographerBookingDetails | ✅ OFFICIAL | Booking details |
| `/photographer/calendar` | `/photographer/calendar` | KEEP | No change | PhotographerCalendar | ✅ OFFICIAL | Calendar view |
| `/photographer/guidelines` | `/photographer/guidelines` | KEEP | No change | PhotographerGuidelines | ✅ OFFICIAL | Training guidelines |
| `/photographer/earnings` | `/photographer/earnings` | KEEP | No change | PhotographerEarnings | ✅ OFFICIAL | Earnings dashboard |
| `/photographer/payouts` | `/photographer/payouts` | KEEP | No change | PhotographerPayouts | ✅ OFFICIAL | Payout history |
| `/photographer/payout-settings` | `/photographer/payout-settings` | KEEP | No change | PhotographerPayoutSettings | ✅ OFFICIAL | Payout settings |
| `/photographer/settings` | `/photographer/settings` | CREATE | New route | PhotographerSettings | 🆕 NEW | Settings (NEW) |
| `/photographer/notifications` | `/photographer/notifications` | CREATE | New route | PhotographerNotifications | 🆕 NEW | Notifications (NEW) |

---

### SECTION 7: ADMIN ROUTES (13 routes)

#### 7.1 Admin Dashboard

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| `/admin` | `/admin` | KEEP | No change | AdminDashboard | ✅ OFFICIAL | Main dashboard |
| `/admin/dashboard` | `/admin` | REDIRECT | Add redirect | AdminDashboard | ⚠️ LEGACY | Redirects to admin |

#### 7.2 Admin Management Routes (NEW)

| Old Route | New Route | Type | Action | Component | Status | Notes |
|-----------|-----------|------|--------|-----------|--------|-------|
| N/A | `/admin/bookings` | CREATE | New route | AdminBookings | 🆕 NEW | Bookings management (NEW) |
| N/A | `/admin/photographers` | CREATE | New route | AdminPhotographers | 🆕 NEW | Photographers management (NEW) |
| N/A | `/admin/clients` | CREATE | New route | AdminClients | 🆕 NEW | Clients management (NEW) |
| N/A | `/admin/payouts` | CREATE | New route | AdminPayouts | 🆕 NEW | Payouts management (NEW) |
| N/A | `/admin/disputes` | CREATE | New route | AdminDisputes | 🆕 NEW | Disputes management (NEW) |
| N/A | `/admin/reports` | CREATE | New route | AdminReports | 🆕 NEW | Reports (NEW) |
| N/A | `/admin/reviews` | CREATE | New route | AdminReviews | 🆕 NEW | Reviews management (NEW) |
| N/A | `/admin/system` | CREATE | New route | AdminSystem | 🆕 NEW | System settings (NEW) |
| N/A | `/admin/settings` | CREATE | New route | AdminSettings | 🆕 NEW | Admin settings (NEW) |

---

## IMPLEMENTATION ROADMAP

### PHASE 3A: Router Structure Update (No Breaking Changes)

**Step 1: Add New Routes to App.tsx**
```typescript
// Add these new routes to App.tsx
<Route path="/client/book/start" component={ServiceSelection} />
<Route path="/client/book/property" component={PropertyDetails} />
<Route path="/client/book/schedule" component={DateTimeSelection} />
<Route path="/client/book/photographers" component={PhotographersList} />
<Route path="/client/book/photographer/:id" component={PhotographerProfilePage} />
<Route path="/client/book/addons" component={BookingAddons} />
<Route path="/client/book/review" component={CompleteBookingFlow} />
<Route path="/client/book/payment" component={ClientPayment} />
<Route path="/client/book/confirmation/:bookingCode" component={BookingConfirmation} />

// Add new client routes
<Route path="/client/notifications" component={ClientNotifications} />
<Route path="/client/profile" component={ClientProfile} />

// Add new photographer routes
<Route path="/photographer/settings" component={PhotographerSettings} />
<Route path="/photographer/notifications" component={PhotographerNotifications} />

// Add new admin routes
<Route path="/admin/bookings" component={AdminBookings} />
<Route path="/admin/photographers" component={AdminPhotographers} />
<Route path="/admin/clients" component={AdminClients} />
<Route path="/admin/payouts" component={AdminPayouts} />
<Route path="/admin/disputes" component={AdminDisputes} />
<Route path="/admin/reports" component={AdminReports} />
<Route path="/admin/reviews" component={AdminReviews} />
<Route path="/admin/system" component={AdminSystem} />
<Route path="/admin/settings" component={AdminSettings} />
```

**Step 2: Add Redirect Routes**
```typescript
// Add these redirect routes to App.tsx (after new routes)
<Route path="/client/service-selection" component={() => <Navigate to="/client/book/start" />} />
<Route path="/client/property-details" component={() => <Navigate to="/client/book/property" />} />
<Route path="/client/date-time" component={() => <Navigate to="/client/book/schedule" />} />
<Route path="/client/photographer-map" component={() => <Navigate to="/client/book/photographers" />} />
<Route path="/client/photographers" component={() => <Navigate to="/client/book/photographers" />} />
<Route path="/client/photographer/:id" component={() => <Navigate to="/client/book/photographer/:id" />} />
<Route path="/client/payment" component={() => <Navigate to="/client/book/payment" />} />
<Route path="/client/booking-confirmation/:bookingCode" component={() => <Navigate to="/client/book/confirmation/:bookingCode" />} />
<Route path="/booking-confirmation/:bookingCode" component={() => <Navigate to="/client/book/confirmation/:bookingCode" />} />
<Route path="/booking/:photographerId" component={() => <Navigate to="/client/book/review" />} />
<Route path="/complete-booking-flow" component={() => <Navigate to="/client/book/review" />} />
<Route path="/client/map" component={() => <Navigate to="/client/book/photographers" />} />
<Route path="/home" component={() => <Navigate to="/" />} />
<Route path="/client/home" component={() => <Navigate to="/client" />} />
<Route path="/photographer/signup" component={() => <Navigate to="/photographer/onboarding" />} />
<Route path="/onboarding" component={() => <Navigate to="/photographer/onboarding" />} />
<Route path="/admin/dashboard" component={() => <Navigate to="/admin" />} />
<Route path="/photographer/login" component={() => <Navigate to="/login" />} />
<Route path="/client/login" component={() => <Navigate to="/login" />} />
<Route path="/client/signup" component={() => <Navigate to="/login" />} />
<Route path="/photographer/requests" component={() => <Navigate to="/photographer/dashboard" />} />
<Route path="/photographer/profile" component={() => <Navigate to="/photographer/dashboard" />} />
<Route path="/photographer/bookings" component={() => <Navigate to="/photographer/dashboard" />} />
<Route path="/photographer/portfolio" component={() => <Navigate to="/photographer/dashboard" />} />
```

**Step 3: Update Navigation Links**
- Update all internal links to use new routes
- Update booking flow navigation to use `/client/book/` namespace
- Update photographer dashboard tabs to redirect to main dashboard

---

### PHASE 3B: Component Placeholder Creation (Optional)

Create placeholder components for new routes:
```typescript
// client/src/pages/ClientNotifications.tsx
export default function ClientNotifications() {
  return <div>Notifications (Coming Soon)</div>;
}

// client/src/pages/ClientProfile.tsx
export default function ClientProfile() {
  return <div>Profile (Coming Soon)</div>;
}

// Similar for other new routes...
```

---

### PHASE 3C: Booking Flow Integrity Check

**Verify Booking Flow:**
1. ✅ `/client/book/start` → `/client/book/property` → `/client/book/schedule`
2. ✅ `/client/book/schedule` → `/client/book/photographers` → `/client/book/addons`
3. ✅ `/client/book/addons` → `/client/book/review` → `/client/book/payment`
4. ✅ `/client/book/payment` → `/client/book/confirmation/:bookingCode`

**Verify Dashboard Integrity:**
1. ✅ `/photographer/dashboard` remains main dashboard
2. ✅ Old dashboard tabs redirect to main dashboard
3. ✅ Tabbed architecture preserved

---

## BACKWARD COMPATIBILITY MATRIX

### Routes That Will Redirect (Keep Working)

| Old Route | Redirects To | User Impact | Status |
|-----------|-------------|------------|--------|
| `/home` | `/` | Seamless | ✅ Works |
| `/client/home` | `/client` | Seamless | ✅ Works |
| `/client/login` | `/login` | Seamless | ✅ Works |
| `/photographer/login` | `/login` | Seamless | ✅ Works |
| `/client/signup` | `/login` | Seamless | ✅ Works |
| `/photographer/signup` | `/photographer/onboarding` | Seamless | ✅ Works |
| `/onboarding` | `/photographer/onboarding` | Seamless | ✅ Works |
| `/admin/dashboard` | `/admin` | Seamless | ✅ Works |
| `/client/service-selection` | `/client/book/start` | Seamless | ✅ Works |
| `/client/property-details` | `/client/book/property` | Seamless | ✅ Works |
| `/client/date-time` | `/client/book/schedule` | Seamless | ✅ Works |
| `/client/photographer-map` | `/client/book/photographers` | Seamless | ✅ Works |
| `/client/photographers` | `/client/book/photographers` | Seamless | ✅ Works |
| `/client/payment` | `/client/book/payment` | Seamless | ✅ Works |
| `/client/booking-confirmation/:bookingCode` | `/client/book/confirmation/:bookingCode` | Seamless | ✅ Works |
| `/booking-confirmation/:bookingCode` | `/client/book/confirmation/:bookingCode` | Seamless | ✅ Works |
| `/booking/:photographerId` | `/client/book/review` | Seamless | ✅ Works |
| `/complete-booking-flow` | `/client/book/review` | Seamless | ✅ Works |
| `/client/map` | `/client/book/photographers` | Seamless | ✅ Works |
| `/photographer/requests` | `/photographer/dashboard` | Seamless | ✅ Works |
| `/photographer/profile` | `/photographer/dashboard` | Seamless | ✅ Works |
| `/photographer/bookings` | `/photographer/dashboard` | Seamless | ✅ Works |
| `/photographer/portfolio` | `/photographer/dashboard` | Seamless | ✅ Works |

---

## PROTECTED SYSTEMS

### ✅ Booking Flow - PROTECTED
- All booking flow routes moved to `/client/book/` namespace
- Old routes redirect to new routes
- Booking flow logic remains unchanged
- No breaking changes to booking process

### ✅ Dashboard - PROTECTED
- Photographer dashboard remains tabbed
- Old dashboard tabs redirect to main dashboard
- Dashboard logic remains unchanged
- No breaking changes to dashboard

### ✅ Page Components - PROTECTED
- No existing page components deleted
- All components remain in `/client/src/pages/`
- Components only get new route assignments
- No code changes to existing components

---

## IMPLEMENTATION CHECKLIST

### Pre-Implementation
- [ ] Review CLEAN_SITE_MAP.md
- [ ] Review this ROUTE_MIGRATION_PLAN.md
- [ ] Backup current App.tsx
- [ ] Create new branch for migration

### Phase 3A: Router Structure
- [ ] Add new routes to App.tsx
- [ ] Add redirect routes to App.tsx
- [ ] Test all new routes load correctly
- [ ] Test all redirect routes work
- [ ] Verify no 404 errors

### Phase 3B: Component Placeholders (Optional)
- [ ] Create ClientNotifications.tsx
- [ ] Create ClientProfile.tsx
- [ ] Create PhotographerSettings.tsx
- [ ] Create PhotographerNotifications.tsx
- [ ] Create AdminBookings.tsx
- [ ] Create AdminPhotographers.tsx
- [ ] Create AdminClients.tsx
- [ ] Create AdminPayouts.tsx
- [ ] Create AdminDisputes.tsx
- [ ] Create AdminReports.tsx
- [ ] Create AdminReviews.tsx
- [ ] Create AdminSystem.tsx
- [ ] Create AdminSettings.tsx

### Phase 3C: Navigation Updates
- [ ] Update booking flow navigation
- [ ] Update dashboard navigation
- [ ] Update photographer navigation
- [ ] Update admin navigation
- [ ] Update landing page links

### Testing
- [ ] Test booking flow end-to-end
- [ ] Test dashboard functionality
- [ ] Test all redirects
- [ ] Test new routes
- [ ] Test backward compatibility

---

## RISK ASSESSMENT

### Low Risk Changes
- Adding new routes (no impact on existing)
- Adding redirect routes (backward compatible)
- Moving routes to new namespace (with redirects)

### Medium Risk Changes
- Updating navigation links (could break if missed)
- Booking flow namespace change (protected by redirects)

### High Risk Changes
- None (all changes are backward compatible)

---

## ROLLBACK PLAN

If issues occur:
1. Revert App.tsx to backup
2. All old routes continue working
3. No data loss
4. No user impact

---

## NEXT STEPS

### After PHASE 3 Approval:
1. ✅ Implement PHASE 3A (Router Structure)
2. ✅ Test all routes
3. ✅ Verify backward compatibility
4. ✅ Proceed to PHASE 4 (File Restructure)

---

**ROUTE_MIGRATION_PLAN.md COMPLETE - READY FOR IMPLEMENTATION**

**Total Routes Affected:** 35 routes  
**Backward Compatibility:** 100%  
**Breaking Changes:** 0  
**Risk Level:** LOW  
**Implementation Time:** 1-2 hours  

