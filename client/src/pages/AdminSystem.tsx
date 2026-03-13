import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, CheckCircle2, Database, Shield, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { trpc } from "@/lib/trpc";

export default function AdminSystem() {
  const [activeTab, setActiveTab] = useState<"general" | "commission" | "notifications">("general");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    platformName: "Snapty",
    platformEmail: "support@snapty.com",
    supportPhone: "+1 (555) 123-4567",
    commissionRate: "35",
    minBookingAmount: "99",
    maxBookingAmount: "5000",
    enableNotifications: true,
    enableEmails: true,
    maintenanceMode: false,
  });

  // Real query to load system settings
  const { data: settingsData, isLoading } = trpc.admin.getSystemSettings.useQuery();

  // Load settings from backend when data arrives
  useEffect(() => {
    if (settingsData) {
      setLocalSettings({
        platformName: settingsData.platformName ?? "Snapty",
        platformEmail: settingsData.platformEmail ?? "support@snapty.com",
        supportPhone: settingsData.supportPhone ?? "+1 (555) 123-4567",
        commissionRate: settingsData.commissionRate ?? "35",
        minBookingAmount: settingsData.minBookingAmount ?? "99",
        maxBookingAmount: settingsData.maxBookingAmount ?? "5000",
        enableNotifications: settingsData.enableNotifications ?? true,
        enableEmails: settingsData.enableEmails ?? true,
        maintenanceMode: settingsData.maintenanceMode ?? false,
      });
    }
  }, [settingsData]);

  // Real mutation to update system settings
  const updateSettings = trpc.admin.updateSystemSettings.useMutation({
    onSuccess: () => {
      toast.success("System settings updated successfully!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update system settings");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setLocalSettings(prev => ({ ...prev, [name]: newValue }));
    // Clear field error on change
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent duplicate submissions
    if (updateSettings.isPending) return;

    // Validate fields
    const errors: Record<string, string> = {};
    if (!localSettings.platformName.trim()) errors.platformName = "Platform name is required";
    if (!localSettings.platformEmail.trim()) {
      errors.platformEmail = "Support email is required";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(localSettings.platformEmail)) {
      errors.platformEmail = "Enter a valid email address";
    }
    const commission = parseFloat(localSettings.commissionRate);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      errors.commissionRate = "Commission rate must be between 0 and 100";
    }
    const minAmt = parseFloat(localSettings.minBookingAmount);
    const maxAmt = parseFloat(localSettings.maxBookingAmount);
    if (isNaN(minAmt) || minAmt < 0) errors.minBookingAmount = "Minimum amount must be 0 or greater";
    if (isNaN(maxAmt) || maxAmt < 0) errors.maxBookingAmount = "Maximum amount must be 0 or greater";
    if (!isNaN(minAmt) && !isNaN(maxAmt) && minAmt >= maxAmt) {
      errors.maxBookingAmount = "Maximum amount must be greater than minimum amount";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    updateSettings.mutate(localSettings);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Configure platform-wide settings and preferences</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            {[
              { id: "general", label: "General", icon: Settings },
              { id: "commission", label: "Commission", icon: Database },
              { id: "notifications", label: "Notifications", icon: Bell },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              System settings saved successfully!
            </div>
          )}
          {updateSettings.isError && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {updateSettings.error?.message || "Failed to save settings. Please try again."}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-6" noValidate>
            {/* General Settings */}
            {activeTab === "general" && (
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure basic platform information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="platformName">Platform Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="platformName"
                      name="platformName"
                      type="text"
                      value={localSettings.platformName}
                      onChange={handleChange}
                      className={`mt-1 ${fieldErrors.platformName ? "border-red-500" : ""}`}
                      disabled={updateSettings.isPending}
                    />
                    {fieldErrors.platformName && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.platformName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="platformEmail">Support Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="platformEmail"
                      name="platformEmail"
                      type="email"
                      value={localSettings.platformEmail}
                      onChange={handleChange}
                      className={`mt-1 ${fieldErrors.platformEmail ? "border-red-500" : ""}`}
                      disabled={updateSettings.isPending}
                    />
                    {fieldErrors.platformEmail && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.platformEmail}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input
                      id="supportPhone"
                      name="supportPhone"
                      type="tel"
                      value={localSettings.supportPhone}
                      onChange={handleChange}
                      className="mt-1"
                      disabled={updateSettings.isPending}
                    />
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">Maintenance Mode</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          When enabled, the platform will be unavailable to users except admins
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                      className={`mt-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localSettings.maintenanceMode ? "bg-red-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings.maintenanceMode ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Commission Settings */}
            {activeTab === "commission" && (
              <Card>
                <CardHeader>
                  <CardTitle>Commission Settings</CardTitle>
                  <CardDescription>Configure booking fees and payment terms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="commissionRate">Platform Commission Rate (%) <span className="text-red-500">*</span></Label>
                    <Input
                      id="commissionRate"
                      name="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={localSettings.commissionRate}
                      onChange={handleChange}
                      className={`mt-1 ${fieldErrors.commissionRate ? "border-red-500" : ""}`}
                      disabled={updateSettings.isPending}
                    />
                    {fieldErrors.commissionRate ? (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.commissionRate}</p>
                    ) : (
                      <p className="text-xs text-gray-600 mt-1">Percentage of each booking retained by the platform (0–100)</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minBookingAmount">Minimum Booking Amount ($) <span className="text-red-500">*</span></Label>
                      <Input
                        id="minBookingAmount"
                        name="minBookingAmount"
                        type="number"
                        min="0"
                        step="1"
                        value={localSettings.minBookingAmount}
                        onChange={handleChange}
                        className={`mt-1 ${fieldErrors.minBookingAmount ? "border-red-500" : ""}`}
                        disabled={updateSettings.isPending}
                      />
                      {fieldErrors.minBookingAmount && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.minBookingAmount}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="maxBookingAmount">Maximum Booking Amount ($) <span className="text-red-500">*</span></Label>
                      <Input
                        id="maxBookingAmount"
                        name="maxBookingAmount"
                        type="number"
                        min="0"
                        step="1"
                        value={localSettings.maxBookingAmount}
                        onChange={handleChange}
                        className={`mt-1 ${fieldErrors.maxBookingAmount ? "border-red-500" : ""}`}
                        disabled={updateSettings.isPending}
                      />
                      {fieldErrors.maxBookingAmount && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {fieldErrors.maxBookingAmount}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Current Configuration</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Platform takes {localSettings.commissionRate}% of each booking. Photographers receive{" "}
                          {(100 - parseFloat(localSettings.commissionRate)).toFixed(1)}%.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure system-wide notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="font-medium text-gray-900">Enable Notifications</Label>
                      <p className="text-sm text-gray-600">Allow system to send notifications to users</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalSettings(prev => ({ ...prev, enableNotifications: !prev.enableNotifications }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localSettings.enableNotifications ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings.enableNotifications ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="font-medium text-gray-900">Enable Email Notifications</Label>
                      <p className="text-sm text-gray-600">Allow system to send emails to users</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalSettings(prev => ({ ...prev, enableEmails: !prev.enableEmails }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localSettings.enableEmails ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings.enableEmails ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" disabled={updateSettings.isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateSettings.isPending}
                className="bg-blue-600 hover:bg-blue-700 min-w-[130px]"
              >
                {updateSettings.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Settings</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
