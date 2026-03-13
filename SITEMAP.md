# Snapty - Application Site Map

خريطة ربط شاملة لجميع صفحات تطبيق Snapty (تطبيق حجز التصوير الفوتوغرافي العقاري)

---

## 🌐 الطرق العامة (Public Routes)

### الصفحات الأساسية
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/` | SplashScreen | شاشة البداية الرئيسية |
| `/login` | Login | صفحة تسجيل الدخول العامة |
| `/home` | HomePremium | الصفحة الرئيسية المميزة |

### صفحات الهبوط (Landing Pages)
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/for-photographers` | PhotographerLandingPage | صفحة هبوط للمصورين |
| `/for-clients` | ClientLanding | صفحة هبوط للعملاء |

---

## 👥 طرق العملاء (Client Routes)

### الملاحة الرئيسية
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/client/home` | ClientHome | الصفحة الرئيسية للعميل |
| `/client/dashboard` | ClientDashboard | لوحة تحكم العميل |
| `/client/bookings` | ClientBookings | قائمة حجوزات العميل |
| `/client/login` | Login | تسجيل دخول العميل |
| `/client/signup` | Login | إنشاء حساب عميل جديد |

### عملية الحجز (Booking Flow)
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/client/service-selection` | ServiceSelection | اختيار الخدمات |
| `/client/property-details` | PropertyDetails | تفاصيل العقار |
| `/client/date-time` | DateTimeSelection | اختيار التاريخ والوقت |
| `/client/photographer-map` | PhotographerMapScreen | خريطة المصورين |
| `/client/map` | PhotographerMapScreen | خريطة بديلة |
| `/client/photographers` | PhotographersList | قائمة المصورين |
| `/client/photographer/:id` | PhotographerProfilePage | ملف المصور الشخصي |
| `/booking/:photographerId` | BookingFlow | نموذج الحجز |
| `/complete-booking-flow` | CompleteBookingFlow | ملخص الحجز قبل الدفع |

### الدفع والتأكيد
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/client/payment` | ClientPayment | صفحة الدفع |
| `/client/booking-confirmation/:bookingCode` | BookingConfirmation | تأكيد الحجز |
| `/booking-confirmation/:bookingCode` | BookingConfirmation | تأكيد الحجز (بديل) |

### المعرض والتفاصيل
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/client/gallery/:bookingCode` | ClientGallery | معرض الصور للعميل |
| `/client/booking-details/:bookingCode` | BookingDetails | تفاصيل الحجز |

---

## 📸 طرق المصورين (Photographer Routes)

### لوحة التحكم الرئيسية
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/photographer` | PhotographerDashboardNew | لوحة تحكم المصور الرئيسية |
| `/photographer/requests` | PhotographerDashboardNew | طلبات الحجز |
| `/photographer/profile` | PhotographerDashboardNew | ملف المصور الشخصي |
| `/photographer/bookings` | PhotographerDashboardNew | حجوزات المصور |
| `/photographer/portfolio` | PhotographerDashboardNew | معرض أعمال المصور |

### التسجيل والإعداد (Onboarding)
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/photographer/apply` | PhotographerApply | نموذج التقديم للمصورين |
| `/photographer/signup` | PhotographerOnboarding | تسجيل مصور جديد |
| `/photographer/onboarding` | PhotographerOnboarding | عملية الإعداد |
| `/onboarding` | PhotographerOnboarding | الإعداد (رابط مختصر) |

### الحجوزات والتقويم
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/photographer/booking-details/:bookingCode` | PhotographerBookingDetails | تفاصيل حجز المصور |
| `/photographer/calendar` | PhotographerCalendar | تقويم المصور |

### الأرباح والدفع
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/photographer/earnings` | PhotographerEarnings | أرباح المصور |
| `/photographer/payouts` | PhotographerPayouts | المدفوعات |
| `/photographer/payout-settings` | PhotographerPayoutSettings | إعدادات المدفوعات |

### التدريب والإرشادات
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/photographer/guidelines` | PhotographerGuidelines | إرشادات التصوير |

### الدخول
| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/photographer/login` | Login | تسجيل دخول المصور |

---

## 🔐 طرق الإدارة (Admin Routes)

| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/admin` | AdminDashboard | لوحة تحكم الإدارة الرئيسية |
| `/admin/dashboard` | AdminDashboard | لوحة التحكم |
| `/admin/login` | AdminLogin | تسجيل دخول الإدارة |

---

## ❌ صفحات الأخطاء

| الرابط | الصفحة | الوصف |
|--------|--------|--------|
| `/404` | NotFound | صفحة الخطأ 404 |
| `/*` | NotFound | أي رابط غير موجود |

---

## 📊 خريطة تدفق العملية

### تدفق العميل (Client Flow)
```
/ (SplashScreen)
  ↓
/for-clients (ClientLanding)
  ↓
/client/login أو /client/signup
  ↓
/client/home (ClientHome)
  ↓
/client/service-selection (اختيار الخدمات)
  ↓
/client/property-details (تفاصيل العقار)
  ↓
/client/date-time (اختيار التاريخ والوقت)
  ↓
/client/photographer-map أو /client/photographers (اختيار المصور)
  ↓
/booking/:photographerId (نموذج الحجز)
  ↓
/complete-booking-flow (ملخص الحجز)
  ↓
/client/payment (الدفع)
  ↓
/client/booking-confirmation/:bookingCode (التأكيد)
  ↓
/client/gallery/:bookingCode (معرض الصور)
```

### تدفق المصور (Photographer Flow)
```
/ (SplashScreen)
  ↓
/for-photographers (PhotographerLandingPage)
  ↓
/photographer/apply (نموذج التقديم)
  ↓
/photographer/signup أو /onboarding (الإعداد)
  ↓
/photographer (لوحة التحكم الرئيسية)
  ↓
/photographer/bookings (الحجوزات)
  ↓
/photographer/booking-details/:bookingCode (تفاصيل الحجز)
  ↓
/photographer/calendar (التقويم)
  ↓
/photographer/earnings (الأرباح)
  ↓
/photographer/payouts (المدفوعات)
```

### تدفق الإدارة (Admin Flow)
```
/admin/login (AdminLogin)
  ↓
/admin (AdminDashboard)
  ↓
/admin/dashboard (لوحة التحكم)
```

---

## 🔗 الروابط المهمة

### روابط الدخول
- **عميل:** `/client/login` أو `/client/signup`
- **مصور:** `/photographer/login` أو `/photographer/apply`
- **إدارة:** `/admin/login`

### روابط الهبوط
- **للعملاء:** `/for-clients`
- **للمصورين:** `/for-photographers`

### روابط رئيسية
- **الصفحة الرئيسية:** `/`
- **لوحة تحكم العميل:** `/client/dashboard`
- **لوحة تحكم المصور:** `/photographer`
- **لوحة تحكم الإدارة:** `/admin`

---

## 📱 الصفحات المتاحة للجوال

جميع الصفحات مصممة بشكل استجابي وتعمل على الأجهزة المحمولة:
- ✅ العميل (Client)
- ✅ المصور (Photographer)
- ✅ الإدارة (Admin)

---

## 🎯 ملخص الإحصائيات

| الفئة | العدد |
|-------|-------|
| طرق عامة | 5 |
| طرق العميل | 19 |
| طرق المصور | 17 |
| طرق الإدارة | 3 |
| صفحات الأخطاء | 2 |
| **المجموع** | **46** |

---

## 📝 ملاحظات مهمة

1. **المسارات الديناميكية:** بعض المسارات تحتوي على معاملات ديناميكية مثل `:photographerId` و `:bookingCode`
2. **المسارات البديلة:** بعض الصفحات متاحة عبر عدة مسارات (مثل `/onboarding` و `/photographer/onboarding`)
3. **المصادقة:** جميع طرق العميل والمصور والإدارة تتطلب المصادقة
4. **الأدوار:** بعض الصفحات متاحة فقط لأدوار معينة (عميل، مصور، إدارة)

---

**آخر تحديث:** 2026-03-12
**الإصدار:** 7a53c575
