import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, CheckCircle, Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface PortfolioPhoto {
  file: File;
  preview: string;
  description: string;
}

export function PhotographerPortfolioOnboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Form state
  const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioPhoto[]>([]);
  const [independentContractorAgreed, setIndependentContractorAgreed] = useState(false);
  const [termsOfServiceAgreed, setTermsOfServiceAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Mutations
  const submitOnboardingMutation = trpc.photographers.submitPortfolioOnboarding.useMutation();

  // Handlers
  const handlePortfolioPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (portfolioPhotos.length >= 10) {
        toast.error("Maximum 10 photos allowed");
        break;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 20MB)`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPortfolioPhotos((prev) => [
          ...prev,
          {
            file,
            preview: event.target?.result as string,
            description: "",
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePortfolioPhoto = (index: number) => {
    setPortfolioPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePhotoDescription = (index: number, description: string) => {
    setPortfolioPhotos((prev) => {
      const updated = [...prev];
      updated[index].description = description;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (portfolioPhotos.length < 5) {
      toast.error("Please upload at least 5 portfolio photos");
      return;
    }
    if (!independentContractorAgreed || !termsOfServiceAgreed) {
      toast.error("Please agree to all terms and conditions");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload portfolio photos to S3
      const uploadedPhotos = [];
      for (const photo of portfolioPhotos) {
        const formData = new FormData();
        formData.append("file", photo.file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${photo.file.name}`);
        }

        const { url } = await uploadResponse.json();
        uploadedPhotos.push({
          url,
          description: photo.description,
        });
      }

      // Submit onboarding
      await submitOnboardingMutation.mutateAsync({
        portfolioImages: uploadedPhotos.map(photo => ({ url: photo.url, title: photo.description })),
        legalAgreements: {
          independentContractor: independentContractorAgreed,
          termsOfService: termsOfServiceAgreed,
        },
      });

      setSubmitted(true);
      toast.success("Onboarding completed successfully!");
      setTimeout(() => navigate("/photographer/payout-settings"), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Onboarding Complete</h1>
          <p className="text-gray-600 mb-6">
            Excellent! Now let's set up your payout account with Stripe Connect.
          </p>
          <button
            onClick={() => navigate("/photographer/payout-settings")}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Set Up Payouts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/photographer/apply")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Onboarding</h1>
            <p className="text-sm text-gray-500">Step 2: Portfolio & Legal</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Portfolio Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Portfolio Photos</h2>
            <p className="text-sm text-gray-600 mb-4">Upload 5-10 of your best real estate photography samples</p>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {portfolioPhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.preview}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePortfolioPhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={photo.description}
                    onChange={(e) => updatePhotoDescription(index, e.target.value)}
                    placeholder="Photo description (optional)"
                    className="w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}

              {/* Upload Button */}
              {portfolioPhotos.length < 10 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition h-40">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePortfolioPhotoChange}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-600">Add Photos</p>
                    <p className="text-xs text-gray-500">{portfolioPhotos.length}/10</p>
                  </div>
                </label>
              )}
            </div>

            {portfolioPhotos.length < 5 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                Please upload at least 5 photos ({portfolioPhotos.length}/5)
              </div>
            )}
          </div>

          {/* Legal Agreements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Legal Agreements</h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={independentContractorAgreed}
                  onChange={(e) => setIndependentContractorAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I agree to the <span className="font-semibold">Independent Contractor Agreement</span> *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsOfServiceAgreed}
                  onChange={(e) => setTermsOfServiceAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I agree to the <span className="font-semibold">Snapty Terms of Service</span> *
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || portfolioPhotos.length < 5}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              "Complete Onboarding"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
