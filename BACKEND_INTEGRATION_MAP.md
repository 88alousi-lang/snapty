# Backend Integration Mapping for PHASE 8C

## Client Pages

### 1. ClientProfile.tsx
- **Query**: User profile data (from `useAuth()` context)
- **Mutation**: Update profile (needs: `trpc.users.updateProfile` or similar)
- **Data Fields**: name, email, phone
- **Status**: Needs mutation implementation

### 2. ClientSettings.tsx
- **Query**: User settings (needs: `trpc.users.getSettings` or similar)
- **Mutation**: Update settings (needs: `trpc.users.updateSettings`)
- **Data Fields**: notifications, language, timezone, preferences
- **Status**: Needs query and mutation implementation

### 3. ClientNotifications.tsx
- **Query**: `trpc.notifications.getAll` ✅ CONNECTED
- **Mutation**: Mark as read, delete (needs implementation)
- **Status**: Query connected, mutations pending

### 4. ClientBookings.tsx
- **Query**: `trpc.bookings.getMyBookings` ✅ ALREADY CONNECTED
- **Status**: Fully connected

## Photographer Pages

### 5. PhotographerSettings.tsx
- **Query**: `trpc.photographers.getMyProfile`
- **Mutation**: `trpc.photographers.updateProfile`
- **Data Fields**: name, email, phone, bio, location, experience
- **Status**: Needs implementation

### 6. PhotographerNotifications.tsx
- **Query**: `trpc.notifications.getAll`
- **Mutation**: Mark as read, delete
- **Status**: Needs implementation

### 7. PhotographerBookingDetails.tsx
- **Query**: `trpc.bookings.getById`
- **Status**: Check if already connected

### 8. PhotographerEarnings.tsx
- **Query**: `trpc.earnings.getSummary`, `trpc.earnings.getMonthlyTrend`
- **Status**: Needs implementation

### 9. PhotographerPayouts.tsx
- **Query**: `trpc.payouts.getHistory`
- **Mutation**: `trpc.payouts.requestPayout`
- **Status**: Needs implementation

## Admin Pages

### 10. AdminBookings.tsx
- **Query**: `trpc.admin.getBookings`
- **Mutation**: `trpc.admin.updateBookingStatus`
- **Status**: Needs implementation

### 11. AdminClients.tsx
- **Query**: `trpc.admin.getUsers`
- **Status**: Needs implementation

### 12. AdminPhotographers.tsx
- **Query**: `trpc.admin.getPhotographers`
- **Mutation**: Approve/reject photographer
- **Status**: Needs implementation

### 13. AdminReports.tsx
- **Query**: `trpc.admin.getStats`
- **Status**: Needs implementation

### 14. AdminReviews.tsx
- **Query**: `trpc.reviews.getAll` or similar
- **Status**: Needs implementation

### 15. AdminSystem.tsx
- **Query**: System settings
- **Mutation**: Update system settings
- **Status**: Needs implementation

## Summary
- **Already Connected**: ClientBookings, ClientNotifications (partial)
- **Need Implementation**: 13 pages
- **Total Target**: 15 pages (16 including already-connected)
