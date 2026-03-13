import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bell, Globe, Shield, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ClientLayout } from "@/components/layouts/ClientLayout";
import { trpc } from "@/lib/trpc";

export default function ClientSettings() {
  const [, navigate] = useLocation();

  const [saveSuccess, setSaveSuccess] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingAlerts: true,
    weeklyDigest: false,
    language: "en",
    timezone: "America/New_York",
    dataCollection: true,
  });

  // Fetch real settings from backend
  const { data: settingsData, isLoading, error } = trpc.auth.getUserSettings.useQuery();

  // Mutation to update settings
  const updateSettings = trpc.auth.updateUserSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save settings");
    },
  });

  // Load settings into local state when data arrives
  useEffect(() => {
    if (settingsData) {
      setLocalSettings({
        emailNotifications: settingsData.emailNotifications ?? true,
        smsNotifications: settingsData.smsNotifications ?? false,
        pushNotifications: settingsData.pushNotifications ?? true,
        bookingAlerts: settingsData.bookingAlerts ?? true,
        weeklyDigest: settingsData.weeklyDigest ?? false,
        language: settingsData.language ?? "en",
        timezone: settingsData.timezone ?? "America/New_York",
        dataCollection: settingsData.dataCollection ?? true,
      });
    }
  }, [settingsData]);

  const handleToggle = (key: keyof typeof localSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: typeof prev[key] === "boolean" ? !prev[key] : prev[key],
    }));
  };

  const handleSelectChange = (key: keyof typeof localSettings, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent duplicate submissions
    if (updateSettings.isPending) return;
    updateSettings.mutate(localSettings);
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-600 font-medium">Failed to load settings</p>
            <p className="text-gray-500 text-sm mt-1">{error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your preferences and account settings</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Settings saved successfully!
            </div>
          )}
          {updateSettings.isError && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <span className="font-medium">Error:</span> {updateSettings.error?.message || "Failed to save settings. Please try again."}
            </div>
          )}
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Notifications
                </CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium text-gray-900">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Get updates via email</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("emailNotifications")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.emailNotifications ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.emailNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium text-gray-900">SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Get updates via text message</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("smsNotifications")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.smsNotifications ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.smsNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium text-gray-900">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Get updates in your browser</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("pushNotifications")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.pushNotifications ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.pushNotifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium text-gray-900">Booking Alerts</Label>
                    <p className="text-sm text-gray-600">Get notified about booking updates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("bookingAlerts")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.bookingAlerts ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.bookingAlerts ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium text-gray-900">Weekly Digest</Label>
                    <p className="text-sm text-gray-600">Get a weekly summary of activity</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("weeklyDigest")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.weeklyDigest ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.weeklyDigest ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Preferences
                </CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language" className="font-medium text-gray-900">
                    Language
                  </Label>
                  <select
                    id="language"
                    value={localSettings.language}
                    onChange={(e) => handleSelectChange("language", e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="timezone" className="font-medium text-gray-900">
                    Timezone
                  </Label>
                  <select
                    id="timezone"
                    value={localSettings.timezone}
                    onChange={(e) => handleSelectChange("timezone", e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Privacy
                </CardTitle>
                <CardDescription>Control your data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium text-gray-900">Allow Analytics</Label>
                    <p className="text-sm text-gray-600">Help us improve by sharing usage data</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("dataCollection")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.dataCollection ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.dataCollection ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/client")}
              >
                Cancel
              </Button>
                  <Button
                    type="submit"
                    disabled={updateSettings.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateSettings.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
            </div>
          </form>
        </div>
      </div>
    </ClientLayout>
  );
}
