import { useState } from "react";
import { Star, Flag, MessageSquare, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { trpc } from "@/lib/trpc";

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  flagged: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("all");

  const { data: reviews, isLoading, isError, error } = trpc.admin.getAllReviews.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  // Unwrap server-paginated response
  const reviewRows = reviews?.rows ?? [];
  const total = reviews?.total ?? 0;

  const filtered = reviewRows.filter((r: any) => {
    if (filter === "all") return true;
    return (r.status ?? "approved") === filter;
  });

  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
            <p className="text-sm text-gray-600 mt-1">Manage and moderate customer reviews</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Filter Pills */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {["all", "approved", "flagged", "pending"].map(status => (
              <button
                key={status}
                onClick={() => { setFilter(status); setPage(0); }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status === "all" ? "All Reviews" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading reviews...</span>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex items-center gap-3 py-8 px-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">
                Failed to load reviews: {(error as any)?.message ?? "Unknown error"}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <MessageSquare className="w-14 h-14 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No reviews found</p>
              <p className="text-sm mt-1">
                {filter !== "all" ? "Try a different filter" : "No reviews have been submitted yet"}
              </p>
            </div>
          )}

          {/* Reviews List */}
          {!isLoading && !isError && filtered.length > 0 && (
            <>
              <div className="space-y-4 mb-6">
                {filtered.map((review: any) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {review.photographerName ?? "Unknown Photographer"}
                          </p>
                          <p className="text-sm text-gray-600">
                            by {review.clientName ?? "Unknown Client"}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[review.status ?? "approved"] ?? "bg-gray-100 text-gray-800"}`}>
                          {((review.status ?? "approved") as string).charAt(0).toUpperCase() + ((review.status ?? "approved") as string).slice(1)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <StarRating rating={review.rating ?? 0} />
                      </div>

                      {review.comment && (
                        <p className="text-gray-700 mb-3 text-sm leading-relaxed">{review.comment}</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {review.bookingCode && (
                          <span>Booking: <span className="font-mono font-semibold">{review.bookingCode}</span></span>
                        )}
                        <span>
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "—"}
                        </span>
                      </div>

                      {(review.status ?? "approved") === "flagged" && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
                          <Flag className="w-3 h-3" />
                          This review has been flagged for moderation
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Page {page + 1} · {PAGE_SIZE} per page
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={!hasPrev}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNext}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
