import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Camera, CheckCircle2, ArrowLeft, ArrowRight,
  Calendar, Briefcase, User, Image, AlertCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Step indices (0-based internally, displayed as 1-based to user)
// 0 = Profile, 1 = Services, 2 = Availability, 3 = Portfolio
const STEP_LABELS = ["Your Profile", "Your Services", "Your Availability", "Portfolio"];
const STEP_ICONS = [User, Briefcase, Calendar, Image];

export default function PhotographerOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Profile form
  const [profileData, setProfileData] = useState({
    bio: "", yearsExperience: "", address: "", city: "", state: "", zipCode: ""
  });

  // Services
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  // Availability
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  // Portfolio
  const [portfolioImage, setPortfolioImage] = useState<File | null>(null);
  const [portfolioTitle, setPortfolioTitle] = useState("");

  // tRPC mutations and queries
  const createProfile = trpc.photographers.createProfile.useMutation();
  const addService = trpc.photographers.addService.useMutation();
  const setAvailabilityMutation = trpc.photographers.setAvailability.useMutation();
  const addPortfolioImage = trpc.portfolio.addImage.useMutation();
  const updateOnboardingStep = trpc.photographers.updateOnboardingStep.useMutation();
  const uploadImage = trpc.portfolio.uploadImage.useMutation();
  const allServices = trpc.services.list.useQuery();

  // Fetch existing profile to resume from saved step
  const myProfileQuery = trpc.photographers.getMyProfile.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Determine starting step from saved progress
  // onboardingStep in DB: 0=profile done, 1=services done, 2=avail done, 3=portfolio done
  // We display step = savedStep + 1 (so if profile is done, we start on step 2 = services)
  const savedStep = myProfileQuery.data?.photographer?.onboardingStep ?? -1;
  // -1 means no profile yet → start at step 1 (index 0)
  // 0 means profile done → resume at step 2 (index 1)
  // 1 means services done → resume at step 3 (index 2)
  // 2 means availability done → resume at step 4 (index 3)
  // 3 means all done → redirect to dashboard
  const [currentStep, setCurrentStep] = useState<number | null>(null); // null = loading

  useEffect(() => {
    if (myProfileQuery.isLoading) return;

    if (savedStep >= 3) {
      // Already completed — go to dashboard
      navigate("/photographer");
      return;
    }

    // Resume from next incomplete step
    const resumeStep = savedStep + 1; // 0-based index of next step to complete
    setCurrentStep(resumeStep);

    // Pre-fill profile data if profile exists
    const p = myProfileQuery.data?.photographer;
    if (p) {
      setProfileData({
        bio: p.bio ?? "",
        yearsExperience: p.yearsExperience?.toString() ?? "",
        address: p.address ?? "",
        city: p.city ?? "",
        state: p.state ?? "",
        zipCode: p.zipCode ?? "",
      });
    }

    // Pre-fill selected services
    const existingServices = myProfileQuery.data?.services ?? [];
    if (existingServices.length > 0) {
      setSelectedServices(existingServices.map((s: any) => s.service.id));
    }

    // Pre-fill availability
    const existingAvail = myProfileQuery.data?.availability ?? [];
    if (existingAvail.length > 0) {
      const days = existingAvail
        .filter((a: any) => a.dayOfWeek !== null && a.dayOfWeek !== undefined)
        .map((a: any) => a.dayOfWeek as number);
      if (days.length > 0) setAvailableDays(days);
      const firstSlot = existingAvail.find((a: any) => a.startTime);
      if (firstSlot) {
        setStartTime(firstSlot.startTime ?? "09:00");
        setEndTime(firstSlot.endTime ?? "17:00");
      }
    }
  }, [myProfileQuery.isLoading, myProfileQuery.data]);

  // ─── Step handlers ────────────────────────────────────────────────────────────

  const handleProfileSubmit = async () => {
    if (!profileData.bio.trim()) { toast.error("Please add a bio"); return; }
    if (!profileData.city.trim() || !profileData.state.trim()) { toast.error("City and state are required"); return; }
    setIsLoading(true);
    try {
      await createProfile.mutateAsync({
        bio: profileData.bio,
        yearsExperience: parseInt(profileData.yearsExperience) || 0,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        zipCode: profileData.zipCode,
      });
      // Save progress: step 0 = profile complete
      await updateOnboardingStep.mutateAsync({ step: 0 });
      toast.success("Profile saved!");
      setCurrentStep(1);
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleServicesSubmit = async () => {
    if (selectedServices.length === 0) { toast.error("Please select at least one service"); return; }
    setIsLoading(true);
    try {
      for (const serviceId of selectedServices) {
        await addService.mutateAsync({ serviceId });
      }
      // Save progress: step 1 = services complete
      await updateOnboardingStep.mutateAsync({ step: 1 });
      toast.success("Services saved!");
      setCurrentStep(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to save services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvailabilitySubmit = async () => {
    if (availableDays.length === 0) { toast.error("Please select at least one available day"); return; }
    setIsLoading(true);
    try {
      const slots = availableDays.map((day) => ({
        dayOfWeek: day,
        startTime,
        endTime,
        isAvailable: true,
      }));
      await setAvailabilityMutation.mutateAsync({ slots });
      // Save progress: step 2 = availability complete
      await updateOnboardingStep.mutateAsync({ step: 2 });
      toast.success("Availability saved!");
      setCurrentStep(3);
    } catch (err: any) {
      toast.error(err.message || "Failed to save availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioSubmit = async () => {
    setIsLoading(true);
    try {
      if (portfolioImage) {
        // Get presigned upload URL from server
        // Convert file to base64 and upload via tRPC
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // strip data:image/...;base64, prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(portfolioImage);
        });
        const { url: cdnUrl } = await uploadImage.mutateAsync({
          fileName: portfolioImage.name,
          contentType: portfolioImage.type,
          base64Data,
        });
        await addPortfolioImage.mutateAsync({
          imageUrl: cdnUrl,
          title: portfolioTitle || "Portfolio Image",
        });
      }
      // Save progress: step 3 = portfolio complete (all done)
      await updateOnboardingStep.mutateAsync({ step: 3 });
      toast.success("🎉 Profile setup complete! Welcome to Snapty!");
      navigate("/photographer");
    } catch (_: any) {
      // Even if portfolio upload fails, mark onboarding complete so they can add more from dashboard
      try { await updateOnboardingStep.mutateAsync({ step: 3 }); } catch {}
      toast.success("Profile setup complete! You can add portfolio images from your dashboard.");
      navigate("/photographer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipPortfolio = async () => {
    try { await updateOnboardingStep.mutateAsync({ step: 3 }); } catch {}
    toast.success("Welcome to Snapty! Add portfolio images from your dashboard.");
    navigate("/photographer");
  };

  const toggleDay = (d: number) =>
    setAvailableDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));
  const toggleService = (id: number) =>
    setSelectedServices((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (myProfileQuery.isLoading || currentStep === null) {
    return (
    <PhotographerLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your profile...</p>
        </div>
      </div>
      </PhotographerLayout>
  );
  }

  const totalSteps = 4;
  const displayStep = currentStep + 1; // 1-based for display

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="flex-1">
              <p className="text-xs text-gray-400">Step {displayStep} of {totalSteps}</p>
              <h1 className="text-lg font-bold text-gray-900">{STEP_LABELS[currentStep]}</h1>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Step icons */}
          <div className="flex justify-between mt-2">
            {STEP_LABELS.map((label, i) => {
              const Icon = STEP_ICONS[i];
              const isDone = i < currentStep;
              const isActive = i === currentStep;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-0.5 transition-colors ${
                    isDone ? "text-green-500" : isActive ? "text-blue-600" : "text-gray-300"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resuming banner */}
      {savedStep >= 0 && currentStep > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Resuming from where you left off.</span>{" "}
              Steps 1–{currentStep} are already saved.
            </p>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-32">

        {/* ── Step 1: Profile ── */}
        {currentStep === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700">Bio *</Label>
              <Textarea
                placeholder="Tell clients about your photography experience, style, and what makes you unique..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="mt-1.5 rounded-xl border-gray-200 resize-none"
                rows={4}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Years of Experience</Label>
              <Input
                type="number"
                placeholder="e.g., 5"
                value={profileData.yearsExperience}
                onChange={(e) => setProfileData({ ...profileData, yearsExperience: e.target.value })}
                className="mt-1.5 rounded-xl border-gray-200"
                min="0"
                max="50"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Street Address</Label>
              <Input
                placeholder="123 Main St"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                className="mt-1.5 rounded-xl border-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold text-gray-700">City *</Label>
                <Input
                  placeholder="New York"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  className="mt-1.5 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">State *</Label>
                <Input
                  placeholder="NY"
                  value={profileData.state}
                  onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                  className="mt-1.5 rounded-xl border-gray-200"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">ZIP Code</Label>
              <Input
                placeholder="10001"
                value={profileData.zipCode}
                onChange={(e) => setProfileData({ ...profileData, zipCode: e.target.value })}
                className="mt-1.5 rounded-xl border-gray-200"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Services ── */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Select all services you offer to clients.</p>
            {allServices.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              (allServices.data ?? []).map((svc: any) => (
                <button
                  key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                    selectedServices.includes(svc.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${selectedServices.includes(svc.id) ? "text-blue-700" : "text-gray-800"}`}>
                      {svc.name}
                    </p>
                    {svc.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{svc.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{svc.serviceType}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-600">
                      ${parseFloat(String(svc.basePrice ?? 0)).toFixed(0)}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        selectedServices.includes(svc.id)
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedServices.includes(svc.id) && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── Step 3: Availability ── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Set your weekly availability so clients can book you at the right times.
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-800 mb-3">Available Days</p>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-xs font-semibold transition-all ${
                      availableDays.includes(i)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {availableDays.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Available: {availableDays.sort((a, b) => a - b).map((d) => FULL_DAYS[d]).join(", ")}
                </p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-sm font-bold text-gray-800">Working Hours</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Start Time</Label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">End Time</Label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-medium">
                  Available {startTime} – {endTime} on {availableDays.length} day
                  {availableDays.length !== 1 ? "s" : ""} per week
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Portfolio ── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Upload a sample image to showcase your work. You can add more from your dashboard.
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <label className="block cursor-pointer">
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                    portfolioImage
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {portfolioImage ? (
                    <div>
                      <CheckCircle2 className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-blue-700">{portfolioImage.name}</p>
                      <p className="text-xs text-blue-500">
                        {(portfolioImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-600">Click to upload a photo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPortfolioImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              </label>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Image Title (Optional)</Label>
                <Input
                  placeholder="e.g., Modern Apartment in Manhattan"
                  value={portfolioTitle}
                  onChange={(e) => setPortfolioTitle(e.target.value)}
                  className="mt-1.5 rounded-xl border-gray-200"
                />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-xs text-yellow-700">
                <span className="font-semibold">Note:</span> Your profile will be reviewed by our
                team before you start receiving bookings. This usually takes 1–2 business days.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto space-y-2">
          <Button
            onClick={
              currentStep === 0
                ? handleProfileSubmit
                : currentStep === 1
                ? handleServicesSubmit
                : currentStep === 2
                ? handleAvailabilitySubmit
                : handlePortfolioSubmit
            }
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</>
            ) : currentStep === 3 ? (
              <><CheckCircle2 className="w-5 h-5 mr-2" />Complete Setup</>
            ) : (
              <>Continue <ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
          {currentStep === 3 && (
            <button
              onClick={handleSkipPortfolio}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition py-1"
            >
              Skip for now — add photos from dashboard later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
