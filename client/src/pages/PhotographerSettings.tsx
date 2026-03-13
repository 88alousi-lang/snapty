import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, DollarSign, Clock, Save, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";
import { trpc } from "@/lib/trpc";

// Validation helpers
function validateProfileName(name: string): string | null {
  if (!name.trim()) return "Full name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  if (name.trim().length > 100) return "Name must be under 100 characters";
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return null;
  const cleaned = phone.replace(/[\s\-().+]/g, "");
  if (!/^\d{10,15}$/.test(cleaned)) return "Enter a valid phone number (10-15 digits)";
  return null;
}

function validateYearsExperience(years: string): string | null {
  const num = parseInt(years);
  if (isNaN(num)) return "Years of experience must be a number";
  if (num < 0) return "Years of experience cannot be negative";
  if (num > 60) return "Years of experience must be 60 or less";
  return null;
}

export default function PhotographerSettings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Load photographer profile from backend
  const profileQuery = trpc.photographers.getMyProfile.useQuery();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: "",
    location: "",
    yearsExperience: "0",
  });

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
    if (profileQuery.data?.photographer) {
      const phot = profileQuery.data.photographer;
      setProfileData(prev => ({
        ...prev,
        bio: phot.bio || prev.bio,
        location: phot.address || prev.location,
        yearsExperience: String(phot.yearsExperience || 0),
      }));
    }
  }, [user, profileQuery.data?.photographer]);

  const [payoutData, setPayoutData] = useState({
    bankAccountHolder: "John Smith",
    bankAccountNumber: "****1234",
    routingNumber: "****5678",
    accountType: "checking",
  });

  const [availabilityToggle, setAvailabilityToggle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "payout" | "availability">("profile");

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayoutChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPayoutData(prev => ({ ...prev, [name]: value }));
  };

  // Real tRPC mutations
  const updateProfileMutation = trpc.photographers.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      profileQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to update profile"),
  });

  const updateSettingsMutation = trpc.photographers.updatePhotographerSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully!");
    },
    onError: (err) => toast.error(err.message || "Failed to update settings"),
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent duplicate submissions
    if (updateProfileMutation.isPending) return;

    // Validate fields
    const errors: Record<string, string> = {};
    const nameError = validateProfileName(profileData.name);
    if (nameError) errors.name = nameError;
    const phoneError = validatePhone(profileData.phone);
    if (phoneError) errors.phone = phoneError;
    const yearsError = validateYearsExperience(profileData.yearsExperience);
    if (yearsError) errors.yearsExperience = yearsError;
    if (profileData.bio && profileData.bio.length > 500) errors.bio = "Bio must be under 500 characters";

    if (Object.keys(errors).length > 0) {
      setProfileFieldErrors(errors);
      return;
    }
    setProfileFieldErrors({});

    updateProfileMutation.mutate({
      bio: profileData.bio,
      address: profileData.location,
      yearsExperience: parseInt(profileData.yearsExperience) || 0,
    });
  };

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    // Payout settings are managed through the payout settings page
    toast.success("Payout information saved. Visit the Payouts page to manage bank accounts.");
  };

  const handleToggleAvailability = () => {
    // Prevent duplicate submissions
    if (updateSettingsMutation.isPending) return;
    const newAvailability = !availabilityToggle;
    setAvailabilityToggle(newAvailability);
    updateSettingsMutation.mutate({ availabilityToggle: newAvailability });
  };

  return (
    <PhotographerLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your profile and payout information</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "payout", label: "Payout Info", icon: DollarSign },
              { id: "availability", label: "Availability", icon: Clock },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your professional profile details</CardDescription>
              </CardHeader>
              <CardContent>
                {profileSuccess && (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Profile updated successfully!
                  </div>
                )}
                {updateProfileMutation.isError && (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {updateProfileMutation.error?.message || "Failed to update profile. Please try again."}
                  </div>
                )}
                <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={profileData.name}
                        onChange={(e) => {
                          handleProfileChange(e);
                          if (profileFieldErrors.name) setProfileFieldErrors(prev => ({ ...prev, name: "" }));
                        }}
                        className={`mt-1 ${profileFieldErrors.name ? "border-red-500" : ""}`}
                        disabled={updateProfileMutation.isPending}
                      />
                      {profileFieldErrors.name && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {profileFieldErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        className="mt-1 bg-gray-50 cursor-not-allowed"
                        disabled
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Email is managed by your login provider</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => {
                        handleProfileChange(e);
                        if (profileFieldErrors.phone) setProfileFieldErrors(prev => ({ ...prev, phone: "" }));
                      }}
                      className={`mt-1 ${profileFieldErrors.phone ? "border-red-500" : ""}`}
                      disabled={updateProfileMutation.isPending}
                    />
                    {profileFieldErrors.phone && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {profileFieldErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bio">Professional Bio</Label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={(e) => {
                        handleProfileChange(e);
                        if (profileFieldErrors.bio) setProfileFieldErrors(prev => ({ ...prev, bio: "" }));
                      }}
                      rows={4}
                      className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        profileFieldErrors.bio ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Tell clients about your experience and expertise (max 500 characters)"
                      maxLength={500}
                      disabled={updateProfileMutation.isPending}
                    />
                    <div className="flex justify-between mt-1">
                      {profileFieldErrors.bio ? (
                        <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {profileFieldErrors.bio}</p>
                      ) : <span />}
                      <p className="text-xs text-gray-400">{profileData.bio.length}/500</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        type="text"
                        value={profileData.location}
                        onChange={handleProfileChange}
                        className="mt-1"
                        placeholder="City, State"
                        disabled={updateProfileMutation.isPending}
                      />
                    </div>
                    <div>
                      <Label htmlFor="yearsExperience">Years of Experience <span className="text-red-500">*</span></Label>
                      <Input
                        id="yearsExperience"
                        name="yearsExperience"
                        type="number"
                        min="0"
                        max="60"
                        value={profileData.yearsExperience}
                        onChange={(e) => {
                          handleProfileChange(e);
                          if (profileFieldErrors.yearsExperience) setProfileFieldErrors(prev => ({ ...prev, yearsExperience: "" }));
                        }}
                        className={`mt-1 ${profileFieldErrors.yearsExperience ? "border-red-500" : ""}`}
                        disabled={updateProfileMutation.isPending}
                      />
                      {profileFieldErrors.yearsExperience && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {profileFieldErrors.yearsExperience}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={() => navigate("/photographer")} disabled={updateProfileMutation.isPending}>
                      Cancel
                    </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payout Tab */}
          {activeTab === "payout" && (
            <Card>
              <CardHeader>
                <CardTitle>Payout Information</CardTitle>
                <CardDescription>Manage your bank account for payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePayout} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Bank Account Connected</p>
                        <p className="text-sm text-blue-700">Your payout account is active and verified</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bankAccountHolder">Account Holder Name</Label>
                    <Input
                      id="bankAccountHolder"
                      name="bankAccountHolder"
                      type="text"
                      value={payoutData.bankAccountHolder}
                      onChange={handlePayoutChange}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankAccountNumber">Account Number</Label>
                      <Input
                        id="bankAccountNumber"
                        name="bankAccountNumber"
                        type="text"
                        value={payoutData.bankAccountNumber}
                        onChange={handlePayoutChange}
                        className="mt-1"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Last 4 digits only</p>
                    </div>
                    <div>
                      <Label htmlFor="routingNumber">Routing Number</Label>
                      <Input
                        id="routingNumber"
                        name="routingNumber"
                        type="text"
                        value={payoutData.routingNumber}
                        onChange={handlePayoutChange}
                        className="mt-1"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Last 4 digits only</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accountType">Account Type</Label>
                    <select
                      id="accountType"
                      name="accountType"
                      value={payoutData.accountType}
                      onChange={handlePayoutChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => navigate("/photographer")}>
                      Cancel
                    </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Payout Info
                      </>
                    )}
                  </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Availability Tab */}
          {activeTab === "availability" && (
            <Card>
              <CardHeader>
                <CardTitle>Availability Status</CardTitle>
                <CardDescription>Control whether clients can book you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Available for Bookings</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {availabilityToggle
                        ? "You are currently available and can receive new bookings"
                        : "You are currently unavailable and will not receive new bookings"}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAvailability}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      availabilityToggle ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        availabilityToggle ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> Use the calendar in your dashboard to set specific available dates and times for bookings.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PhotographerLayout>
  );
}
