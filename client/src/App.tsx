import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { withRoleProtection } from "./components/ProtectedRoute";

// Public pages
import Login from "./pages/Login";
import SplashScreen from "./pages/SplashScreen";
import ClientLanding from "./pages/ClientLanding";
import PhotographerLandingPage from "./pages/PhotographerLandingPage";

// Client pages
import ServiceSelection from "./pages/ServiceSelection";
import PropertyDetails from "./pages/PropertyDetails";
import DateTimeSelection from "./pages/DateTimeSelection";
import PhotographersList from "./pages/PhotographersList";
import PhotographerProfilePage from "./pages/PhotographerProfilePage";
import BookingConfirmation from "./pages/BookingConfirmation";
import ClientPayment from "./pages/ClientPayment";
import ClientBookings from "./pages/ClientBookings";
import BookingDetails from "./pages/BookingDetails";
import ClientDashboard from "./pages/ClientDashboard";
import ClientGallery from "./pages/ClientGallery";
import ClientReview from "./pages/ClientReview";
import CompleteBookingFlow from "./pages/CompleteBookingFlow";

// Photographer pages
import PhotographerApply from "./pages/PhotographerApply";
import PhotographerOnboarding from "./pages/PhotographerOnboarding";
import PhotographerDashboardNew from "./pages/PhotographerDashboardNew";
import PhotographerBookingDetails from "./pages/PhotographerBookingDetails";
import PhotographerCalendar from "./pages/PhotographerCalendar";
import PhotographerEarnings from "./pages/PhotographerEarnings";
import PhotographerPayouts from "./pages/PhotographerPayouts";
import PhotographerPayoutSettings from "./pages/PhotographerPayoutSettings";
import PhotographerGuidelines from "./pages/PhotographerGuidelines";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

// Client feature pages
import ClientProfile from "./pages/ClientProfile";
import ClientSettings from "./pages/ClientSettings";
import ClientNotifications from "./pages/ClientNotifications";

// Photographer feature pages
import PhotographerSettings from "./pages/PhotographerSettings";
import PhotographerNotifications from "./pages/PhotographerNotifications";

// Editor pages
import EditorDashboard from "./pages/EditorDashboard";
import EditorProjectDetail from "./pages/EditorProjectDetail";

// Admin feature pages
import AdminBookings from "./pages/AdminBookings";
import AdminBookingDetail from "./pages/AdminBookingDetail";
import AdminClients from "./pages/AdminClients";
import AdminPhotographers from "./pages/AdminPhotographers";
import AdminReports from "./pages/AdminReports";
import AdminReviews from "./pages/AdminReviews";
import AdminSystem from "./pages/AdminSystem";
import AdminPayouts from "./pages/AdminPayouts";

// Booking flow pages
import BookingAddons from "./pages/BookingAddons";

// Placeholder components for new routes (will be implemented in future phases)
const AdminDisputes = () => <div className="p-8"><h1>Admin Disputes (Coming Soon)</h1></div>;
const AdminSettings = () => <div className="p-8"><h1>Admin Settings (Coming Soon)</h1></div>;

function Router() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <Switch>
      {/* ========== OFFICIAL ROUTES (48 routes) ========== */}

      {/* PUBLIC ROUTES (7 routes) - No role protection needed */}
      <Route path="/" component={SplashScreen} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Login} />
      <Route path="/for-clients" component={ClientLanding} />
      <Route path="/for-photographers" component={PhotographerLandingPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/404" component={NotFound} />

      {/* CLIENT ROUTES - MAIN DASHBOARD (7 routes) - Client only */}
      <Route path="/client" component={withRoleProtection(ClientDashboard, ["user"])} />
      <Route path="/client/bookings" component={withRoleProtection(ClientBookings, ["user"])} />
      <Route path="/client/booking/:bookingCode" component={withRoleProtection(BookingDetails, ["user"])} />
      <Route path="/client/gallery/:bookingCode" component={withRoleProtection(ClientGallery, ["user"])} />
      <Route path="/client/review/:bookingCode" component={withRoleProtection(ClientReview, ["user"])} />
      <Route path="/client/profile" component={withRoleProtection(ClientProfile, ["user"])} />
      <Route path="/client/settings" component={withRoleProtection(ClientSettings, ["user"])} />
      <Route path="/client/notifications" component={withRoleProtection(ClientNotifications, ["user"])} />

      {/* CLIENT ROUTES - BOOKING FLOW (9 routes) - Client only */}
      <Route path="/client/book/start" component={withRoleProtection(ServiceSelection, ["user"])} />
      <Route path="/client/book/property" component={withRoleProtection(PropertyDetails, ["user"])} />
      <Route path="/client/book/schedule" component={withRoleProtection(DateTimeSelection, ["user"])} />
      <Route path="/client/book/photographers" component={withRoleProtection(PhotographersList, ["user"])} />
      <Route path="/client/book/photographer/:id" component={withRoleProtection(PhotographerProfilePage, ["user"])} />
      <Route path="/client/book/addons" component={withRoleProtection(BookingAddons, ["user"])} />
      <Route path="/client/book/review" component={withRoleProtection(CompleteBookingFlow, ["user"])} />
      <Route path="/client/book/payment" component={withRoleProtection(ClientPayment, ["user"])} />
      <Route path="/client/book/confirmation/:bookingCode" component={withRoleProtection(BookingConfirmation, ["user"])} />

      {/* PHOTOGRAPHER ROUTES - MAIN DASHBOARD (1 route) - Photographer only */}
      <Route path="/photographer/dashboard" component={withRoleProtection(PhotographerDashboardNew, ["photographer"])} />

      {/* PHOTOGRAPHER ROUTES - ONBOARDING (1 route) - Public (for new photographers) */}
      <Route path="/photographer/onboarding" component={PhotographerOnboarding} />

      {/* PHOTOGRAPHER ROUTES - APPLICATION (1 route) - Public (for applications) */}
      <Route path="/photographer/apply" component={PhotographerApply} />

      {/* PHOTOGRAPHER ROUTES - FEATURES (8 routes) - Photographer only */}
      <Route path="/photographer/booking/:bookingCode" component={withRoleProtection(PhotographerBookingDetails, ["photographer"])} />
      <Route path="/photographer/calendar" component={withRoleProtection(PhotographerCalendar, ["photographer"])} />
      <Route path="/photographer/guidelines" component={withRoleProtection(PhotographerGuidelines, ["photographer"])} />
      <Route path="/photographer/earnings" component={withRoleProtection(PhotographerEarnings, ["photographer"])} />
      <Route path="/photographer/payouts" component={withRoleProtection(PhotographerPayouts, ["photographer"])} />
      <Route path="/photographer/payout-settings" component={withRoleProtection(PhotographerPayoutSettings, ["photographer"])} />
      <Route path="/photographer/settings" component={withRoleProtection(PhotographerSettings, ["photographer"])} />
      <Route path="/photographer/notifications" component={withRoleProtection(PhotographerNotifications, ["photographer"])} />

      {/* EDITOR ROUTES - Editor only */}
      <Route path="/editor/dashboard" component={withRoleProtection(EditorDashboard, ["editor"])} />
      <Route path="/editor/projects" component={withRoleProtection(EditorDashboard, ["editor"])} />
      <Route path="/editor/completed" component={withRoleProtection(EditorDashboard, ["editor"])} />
      <Route path="/editor/project/:bookingId" component={withRoleProtection(EditorProjectDetail, ["editor"])} />

      {/* ADMIN ROUTES (10 routes) - Admin only */}
      <Route path="/admin" component={withRoleProtection(AdminDashboard, ["admin"])} />
      <Route path="/admin/bookings" component={withRoleProtection(AdminBookings, ["admin"])} />
      <Route path="/admin/bookings/:bookingCode" component={withRoleProtection(AdminBookingDetail, ["admin"])} />
      <Route path="/admin/photographers" component={withRoleProtection(AdminPhotographers, ["admin"])} />
      <Route path="/admin/clients" component={withRoleProtection(AdminClients, ["admin"])} />
      <Route path="/admin/payouts" component={withRoleProtection(AdminPayouts, ["admin"])} />
      <Route path="/admin/disputes" component={withRoleProtection(AdminDisputes, ["admin"])} />
      <Route path="/admin/reports" component={withRoleProtection(AdminReports, ["admin"])} />
      <Route path="/admin/reviews" component={withRoleProtection(AdminReviews, ["admin"])} />
      <Route path="/admin/system" component={withRoleProtection(AdminSystem, ["admin"])} />
      <Route path="/admin/settings" component={withRoleProtection(AdminSettings, ["admin"])} />

      {/* ========== LEGACY REDIRECT ROUTES (24 routes) ========== */}

      {/* HOME REDIRECTS (2 routes) */}
      <Route path="/home" component={() => <SplashScreen />} />
      <Route path="/client/home" component={withRoleProtection(ClientDashboard, ["user"])} />

      {/* LOGIN/SIGNUP REDIRECTS (6 routes) */}
      <Route path="/photographer/login" component={() => <Login />} />
      <Route path="/client/login" component={() => <Login />} />
      <Route path="/client/signup" component={() => <Login />} />
      <Route path="/photographer/signup" component={() => <PhotographerOnboarding />} />
      <Route path="/onboarding" component={() => <PhotographerOnboarding />} />
      <Route path="/admin/dashboard" component={withRoleProtection(AdminDashboard, ["admin"])} />

      {/* BOOKING FLOW REDIRECTS (8 routes) */}
      <Route path="/client/service-selection" component={withRoleProtection(ServiceSelection, ["user"])} />
      <Route path="/client/services" component={withRoleProtection(ServiceSelection, ["user"])} />
      <Route path="/client/property-details" component={withRoleProtection(PropertyDetails, ["user"])} />
      <Route path="/client/date-time" component={withRoleProtection(DateTimeSelection, ["user"])} />
      <Route path="/client/payment" component={withRoleProtection(ClientPayment, ["user"])} />
      <Route path="/complete-booking-flow" component={withRoleProtection(CompleteBookingFlow, ["user"])} />
      <Route path="/client/booking-confirmation/:bookingCode" component={withRoleProtection(BookingConfirmation, ["user"])} />
      <Route path="/booking-confirmation/:bookingCode" component={withRoleProtection(BookingConfirmation, ["user"])} />
      <Route path="/booking/:photographerId" component={withRoleProtection(CompleteBookingFlow, ["user"])} />

      {/* PHOTOGRAPHER MAP REDIRECTS (4 routes) */}
      <Route path="/client/photographer-map" component={withRoleProtection(PhotographersList, ["user"])} />
      <Route path="/client/photographers" component={withRoleProtection(PhotographersList, ["user"])} />
      <Route path="/client/photographer/:id" component={withRoleProtection(PhotographerProfilePage, ["user"])} />
      <Route path="/client/map" component={withRoleProtection(PhotographersList, ["user"])} />

      {/* PHOTOGRAPHER DASHBOARD TAB REDIRECTS (4 routes) */}
      <Route path="/photographer/requests" component={withRoleProtection(PhotographerDashboardNew, ["photographer"])} />
      <Route path="/photographer/profile" component={withRoleProtection(PhotographerDashboardNew, ["photographer"])} />
      <Route path="/photographer/bookings" component={withRoleProtection(PhotographerDashboardNew, ["photographer"])} />
      <Route path="/photographer/portfolio" component={withRoleProtection(PhotographerDashboardNew, ["photographer"])} />

      {/* FALLBACK - 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
