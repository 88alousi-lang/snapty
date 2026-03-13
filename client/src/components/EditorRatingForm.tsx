import { useState } from "react";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface EditorRatingFormProps {
  bookingCode: string;
  bookingId: number;
  photographerId: number;
  onSuccess?: () => void;
}

export function EditorRatingForm({
  bookingCode,
  bookingId,
  photographerId,
  onSuccess,
}: EditorRatingFormProps) {

  const [overallRating, setOverallRating] = useState(0);
  const [photoQualityRating, setPhotoQualityRating] = useState(0);
  const [fileOrganizationRating, setFileOrganizationRating] = useState(0);
  const [instructionRating, setInstructionRating] = useState(0);
  const [editingEaseRating, setEditingEaseRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitRating = trpc.editor.submitRating.useMutation({
    onSuccess: () => {
      alert("Rating submitted successfully");
      setSubmitted(true);
      onSuccess?.();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = async () => {
    if (overallRating === 0) {
      alert("Please provide an overall rating");
      return;
    }

    await submitRating.mutateAsync({
      bookingCode,
      bookingId,
      photographerId,
      overallRating,
      photoQualityRating: photoQualityRating || overallRating,
      fileOrganizationRating: fileOrganizationRating || overallRating,
      instructionRating: instructionRating || overallRating,
      editingEaseRating: editingEaseRating || overallRating,
      notes: notes || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-800 font-medium">✓ Rating submitted successfully</p>
      </div>
    );
  }

  const StarRating = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Internal Editor Rating
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Rate the photographer's work quality. This rating is internal only.
        </p>
      </div>

      <div className="space-y-4">
        <StarRating
          label="Overall Rating"
          value={overallRating}
          onChange={setOverallRating}
        />
        <StarRating
          label="Photo Quality"
          value={photoQualityRating}
          onChange={setPhotoQualityRating}
        />
        <StarRating
          label="File Organization"
          value={fileOrganizationRating}
          onChange={setFileOrganizationRating}
        />
        <StarRating
          label="Following Instructions"
          value={instructionRating}
          onChange={setInstructionRating}
        />
        <StarRating
          label="Ease of Editing"
          value={editingEaseRating}
          onChange={setEditingEaseRating}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Internal Notes (Optional)
        </label>
        <Textarea
          placeholder="Add any feedback or notes about this photographer's work..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-24"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitRating.isPending || overallRating === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {submitRating.isPending ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  );
}
