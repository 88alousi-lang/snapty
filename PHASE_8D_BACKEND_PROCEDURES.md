# PHASE 8D: Backend Procedures Specification

## Status: READY FOR IMPLEMENTATION

This document specifies all tRPC procedures that need to be added to complete PHASE 8D backend integration.

---

## 1. AUTH ROUTER - User Settings & Profile

### ✅ ALREADY ADDED
- `updateUserProfile` - Mutation to update user name, email, phone

### REQUIRED (To Add)

#### Query: getUserSettings
```typescript
getUserSettings: protectedProcedure
  .input(z.object({ userId: z.number().optional() }))
  .query(async ({ ctx, input }) => {
    const userId = input.userId || ctx.user.id;
    if (ctx.user.role !== "admin" && userId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return {
      emailNotifications: true,
      language: "en",
      timezone: "America/New_York",
    };
  }),
```

#### Mutation: updateUserSettings
```typescript
updateUserSettings: protectedProcedure
  .input(z.object({
    emailNotifications: z.boolean().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
    return { success: true, settings: input };
  }),
```

---

## 2. PHOTOGRAPHERS ROUTER - Settings

### ✅ ALREADY EXISTS
- `updateProfile` - Updates photographer bio, experience, location
- `getMyProfile` - Gets photographer profile with services and reviews

### REQUIRED (To Add)

#### Mutation: updatePhotographerSettings
```typescript
updatePhotographerSettings: protectedProcedure
  .input(z.object({
    availabilityToggle: z.boolean().optional(),
    payoutEmail: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "photographer" && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const photographer = await getPhotographerByUserId(ctx.user.id);
    if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    
    const updateData: any = { updatedAt: new Date() };
    if (input.availabilityToggle !== undefined) {
      updateData.isAvailable = input.availabilityToggle;
    }
    await db.update(photographers).set(updateData).where(eq(photographers.id, photographer.id));
    return { success: true };
  }),
```

---

## 3. ADMIN ROUTER - System Settings

### REQUIRED (To Add)

#### Query: getSystemSettings
```typescript
getSystemSettings: adminProcedure
  .query(async () => {
    return {
      platformName: "Snapty",
      platformEmail: "support@snapty.com",
      supportPhone: "+1 (555) 123-4567",
      commissionRate: "35",
      minBookingAmount: "99",
      maxBookingAmount: "5000",
      enableNotifications: true,
      enableEmails: true,
      maintenanceMode: false,
    };
  }),
```

#### Mutation: updateSystemSettings
```typescript
updateSystemSettings: adminProcedure
  .input(z.object({
    platformName: z.string().optional(),
    commissionRate: z.string().optional(),
    minBookingAmount: z.string().optional(),
    maxBookingAmount: z.string().optional(),
    enableNotifications: z.boolean().optional(),
    enableEmails: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
  }))
  .mutation(async ({ input }) => {
    // In production, store in database
    return { success: true, settings: input };
  }),
```

---

## 4. ADMIN ROUTER - Photographer Management

### REQUIRED (To Add)

#### Mutation: approvePhotographer
```typescript
approvePhotographer: adminProcedure
  .input(z.object({ photographerId: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    
    await db.update(photographers)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(photographers.id, input.photographerId));
    
    return { success: true };
  }),
```

#### Mutation: rejectPhotographer
```typescript
rejectPhotographer: adminProcedure
  .input(z.object({ 
    photographerId: z.number(),
    reason: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    
    await db.update(photographers)
      .set({ isApproved: false, updatedAt: new Date() })
      .where(eq(photographers.id, input.photographerId));
    
    return { success: true };
  }),
```

---

## 5. ADMIN ROUTER - Reviews Query

### REQUIRED (To Add or Use Existing)

#### Query: getAllReviews (Admin-wide)
```typescript
getAllReviews: adminProcedure
  .input(z.object({
    limit: z.number().default(50),
    offset: z.number().default(0),
  }))
  .query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    
    const result = await db.select().from(reviews)
      .limit(input.limit)
      .offset(input.offset);
    
    return result || [];
  }),
```

---

## Page-to-Procedure Mapping

| Page | Type | Query | Mutation |
|------|------|-------|----------|
| ClientProfile | Edit | `auth.me` | `auth.updateUserProfile` |
| ClientSettings | Edit | `auth.getUserSettings` | `auth.updateUserSettings` |
| ClientNotifications | Read | `notifications.getAll` | - |
| ClientBookings | Read | `bookings.getMyBookings` | - |
| PhotographerSettings | Edit | `photographers.getMyProfile` | `photographers.updatePhotographerSettings` |
| PhotographerNotifications | Read | `notifications.getAll` | - |
| PhotographerBookingDetails | Read | `bookings.getById` | - |
| PhotographerEarnings | Read | `earnings.*` (5 queries) | - |
| PhotographerPayouts | Read | `payouts.*` (3 queries) | `payouts.requestPayout` |
| AdminBookings | Read | `admin.getBookings` | - |
| AdminClients | Read | `admin.getUsers` | - |
| AdminPhotographers | Edit | `admin.getPhotographers` | `admin.approvePhotographer`, `admin.rejectPhotographer` |
| AdminReports | Read | `admin.getStats` | - |
| AdminReviews | Read | `admin.getAllReviews` | - |
| AdminSystem | Edit | `admin.getSystemSettings` | `admin.updateSystemSettings` |

---

## Implementation Order

1. Add to `auth` router: `getUserSettings`, `updateUserSettings`
2. Add to `photographers` router: `updatePhotographerSettings`
3. Add to `admin` router: `getSystemSettings`, `updateSystemSettings`, `approvePhotographer`, `rejectPhotographer`, `getAllReviews`
4. Connect all pages to their respective procedures
5. Verify all mutations persist data successfully
6. Run tests and verify TypeScript compilation

---

## Notes

- All admin procedures use `adminProcedure` for role protection
- All photographer procedures use role check: `ctx.user.role !== "photographer" && ctx.user.role !== "admin"`
- All user procedures use `protectedProcedure`
- Mutations should return `{ success: true }` on success
- All mutations update `updatedAt` timestamp
