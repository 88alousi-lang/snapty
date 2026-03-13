import { Star, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function PhotographerInternalRatingSummary() {
  const { data: summary, isLoading } = trpc.photographers.getInternalRatingSummary.useQuery();

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-900 font-medium">No internal ratings yet</p>
            <p className="text-blue-700 text-sm mt-1">
              Editors will rate your work after completing editing for your bookings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Internal Editor Rating
        </h3>
        <p className="text-sm text-gray-600">
          Quality feedback from our editing team (not visible to clients)
        </p>
      </div>

      {/* Average Rating */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Average Rating</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {summary.averageRating.toFixed(1)}
            </p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= Math.round(summary.averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Review Count */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 font-medium">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {summary.totalReviews}
          </p>
        </div>
      </div>

      {/* Recent Notes */}
      {summary.recentNotes && summary.recentNotes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">Recent Feedback</p>
          <div className="space-y-2">
            {summary.recentNotes.map((note, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <p className="text-sm text-gray-700">{note.notes}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(note.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 italic">
        This information is private and only visible to you and administrators.
      </p>
    </div>
  );
}
