import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, CheckCircle, X, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layouts/PublicLayout";

// Agreement content
const AGREEMENT_SUMMARY = `
Snapty Photographer Agreement - Key Points:

• Independent Contractor Status: You are an independent contractor, not an employee
• Photo Ownership: All photos are owned by HA Media LLC for 10 years
• Quality Standards: Maintain professional standards and deliver high-quality work
• Confidentiality: Keep client information confidential
• Insurance: Maintain liability insurance for property damage
• FAA Certification: Required for drone services (30-day upload deadline)
• Cancellation Policy: Free cancellation up to 24 hours before shoot
• Tax Compliance: Responsible for your own taxes (W-9 required)
• Data Protection: Comply with data protection regulations
• AI Usage: No AI-generated content without explicit client permission
`;

const FULL_AGREEMENT = `
SNAPTY PHOTOGRAPHER INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is entered into as of the date of acceptance between Snapty ("Platform") and the Photographer ("You").

1. INDEPENDENT CONTRACTOR STATUS
You are an independent contractor, not an employee of Snapty. You are responsible for:
- Your own taxes and withholdings
- Your own insurance and liability
- Your own equipment and supplies
- Compliance with all applicable laws and regulations

2. PHOTO OWNERSHIP AND USAGE
- All photographs taken through Snapty are owned by HA Media LLC for a period of 10 years
- You grant HA Media LLC a perpetual, worldwide license to use photos for marketing and promotional purposes
- After 10 years, ownership reverts to you
- You may not reuse or repurpose photos without explicit written permission

3. QUALITY STANDARDS
You agree to maintain professional standards including:
- High-quality photography techniques
- Proper lighting and composition
- Clean, organized presentation of properties
- Professional editing and post-processing
- Timely delivery of photos (within agreed timeframe)

4. CONFIDENTIALITY
You agree to:
- Keep all client information confidential
- Not disclose property details or client information
- Protect client privacy in all communications
- Not share photos or information with third parties

5. INSURANCE REQUIREMENTS
You must maintain:
- General liability insurance (minimum $1,000,000)
- Property damage liability coverage
- Professional liability insurance
- Proof of insurance upon request

6. FAA PART 107 DRONE CERTIFICATION
If offering drone photography:
- You must be FAA Part 107 certified
- Upload certification within 30 days of application
- Maintain current certification throughout partnership
- Failure to upload results in automatic drone service suspension

7. CANCELLATION POLICY
- Clients can cancel free up to 24 hours before scheduled shoot
- Cancellations within 24 hours are charged in full
- You are responsible for managing your availability calendar
- No-shows result in automatic suspension

8. TAX COMPLIANCE
You are responsible for:
- Providing valid SSN or EIN
- Completing W-9 form
- Paying all applicable taxes
- Maintaining tax records
- Quarterly estimated tax payments

9. PAYMENT AND COMMISSION
- Snapty retains 35% commission on all bookings
- You receive 65% of booking amount
- Payments processed via Stripe Connect
- Payouts available weekly

10. DATA PROTECTION
You agree to:
- Comply with GDPR and CCPA regulations
- Protect client data and privacy
- Use secure storage for client information
- Report any data breaches immediately

11. AI USAGE RESTRICTIONS
- No AI-generated content without explicit client permission
- Disclose any AI-assisted editing to clients
- Maintain transparency about photo processing methods
- Prohibited from using AI to create fake or misleading images

12. TERMINATION
Either party may terminate this agreement with 30 days notice. Snapty may immediately terminate for:
- Violation of quality standards
- Breach of confidentiality
- Failure to maintain insurance
- Unprofessional conduct
- Repeated cancellations or no-shows

13. LIABILITY LIMITATION
Snapty is not liable for:
- Equipment damage or loss
- Personal injury during shoots
- Property damage (covered by your insurance)
- Client disputes or complaints

14. DISPUTE RESOLUTION
- Disputes resolved through binding arbitration
- Governed by applicable state law
- Attorney fees not recoverable

15. MODIFICATION
Snapty reserves the right to modify this agreement with 30 days notice.

By accepting this agreement, you acknowledge that you have read, understood, and agree to all terms and conditions.
`;

export default function PhotographerApply() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [equipmentUsed, setEquipmentUsed] = useState("");
  const [governmentId, setGovernmentId] = useState<File | null>(null);
  const [governmentIdType, setGovernmentIdType] = useState("driver_license");
  const [agreementRead, setAgreementRead] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Mutations
  const submitApplicationMutation = trpc.photographers.submitApplication.useMutation();

  // Handlers
  const handleGovernmentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setGovernmentId(file);
    }
  };

  const handleAgreementClose = () => {
    setShowAgreementModal(false);
    setAgreementRead(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!city.trim()) {
      toast.error("Please enter your city");
      return;
    }
    if (!governmentId) {
      toast.error("Please upload a government ID");
      return;
    }
    if (!agreementRead) {
      toast.error("Please read the full agreement before proceeding");
      return;
    }
    if (!agreementAccepted) {
      toast.error("Please accept the agreement");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload government ID to S3
      const formData = new FormData();
      formData.append("file", governmentId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload government ID");
      }

      const { url: governmentIdUrl } = await uploadResponse.json();

      // Submit application
      await submitApplicationMutation.mutateAsync({
        fullName,
        email,
        phone: phoneNumber,
        city,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
        equipment: equipmentUsed || undefined,
        governmentIdUrl,
      });

      setSubmitted(true);
      toast.success("Application submitted successfully!");
      setTimeout(() => navigate("/photographer/onboarding"), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted</h1>
            <p className="text-gray-600 mb-6">
              Great! Your application has been received. Next, let's complete your onboarding.
            </p>
            <button
              onClick={() => navigate("/photographer/onboarding")}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Continue to Onboarding
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/photographer/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Become a Snapty Photographer</h1>
            <p className="text-sm text-gray-500">Step 1: Application & Agreement</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="New York"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Professional Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Used
                </label>
                <textarea
                  value={equipmentUsed}
                  onChange={(e) => setEquipmentUsed(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Canon EOS R5, DJI Mavic 3, Adobe Lightroom..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Government ID */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Identity Verification</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Government ID Type *
                </label>
                <select
                  value={governmentIdType}
                  onChange={(e) => setGovernmentIdType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="driver_license">Driver's License</option>
                  <option value="passport">Passport</option>
                  <option value="state_id">State ID</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Government ID *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleGovernmentIdChange}
                    className="hidden"
                    id="government-id-input"
                  />
                  <label
                    htmlFor="government-id-input"
                    className="cursor-pointer block"
                  >
                    {governmentId ? (
                      <div className="text-green-600">
                        <p className="font-semibold">{governmentId.name}</p>
                        <p className="text-sm">Click to change</p>
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        <p className="font-semibold mb-1">Click to upload or drag and drop</p>
                        <p className="text-sm">JPG, PNG, or PDF (Max 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Section */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Snapty Photographer Agreement</h2>

            {/* Agreement Summary */}
            <div className="bg-white rounded-lg p-4 mb-4 max-h-48 overflow-y-auto border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono text-xs">
                {AGREEMENT_SUMMARY}
              </p>
            </div>

            {/* Read Agreement Button */}
            <button
              type="button"
              onClick={() => setShowAgreementModal(true)}
              className="w-full mb-4 px-4 py-3 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Read Full Agreement
            </button>

            {/* Agreement Status */}
            {agreementRead && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-semibold">✓ You have read the full agreement</p>
              </div>
            )}

            {/* Acceptance Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                disabled={!agreementRead}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">
                I have read and accept the <span className="font-semibold">Snapty Photographer Agreement</span> *
              </span>
            </label>

            {!agreementRead && (
              <p className="text-xs text-gray-500 mt-2">
                Please read the full agreement before you can accept
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !agreementRead || !agreementAccepted}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
      </div>

      {/* Agreement Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Snapty Photographer Agreement</h3>
              <button
                onClick={handleAgreementClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {FULL_AGREEMENT}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={handleAgreementClose}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PublicLayout>
  );
}
