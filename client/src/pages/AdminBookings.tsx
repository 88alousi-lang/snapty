import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { trpc } from "@/lib/trpc";

const PAGE_SIZE = 15;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  delivered: "bg-teal-100 text-teal-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  rejected: "bg-gray-100 text-gray-800",
};

const STATUS_OPTIONS = ["all", "pending", "accepted", "in_progress", "delivered", "completed", "cancelled", "rejected"];

export default function AdminBookings() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bookings, isLoading, isError, error } = trpc.admin.getBookings.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  // Unwrap server-paginated response
  const rows = bookings?.rows ?? [];
  const total = bookings?.total ?? 0;

  // Client-side filter on top of server pagination (for search/status within current page)
  const filtered = rows.filter((b: any) => {
    const item = b.booking ?? b;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      (item.bookingCode ?? "").toLowerCase().includes(q) ||
      (b.clientName ?? "").toLowerCase().includes(q) ||
      (b.photographerName ?? "").toLowerCase().includes(q) ||
      (item.propertyAddress ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all bookings and track their status</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by code, client, photographer, or property..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                  className="w-full pl-10"
                />
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(0); }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {status === "all" ? "All Statuses" : status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Table Card */}
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `Showing ${filtered.length} of ${total} total`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading bookings...</span>
                </div>
              )}

              {/* Error state */}
              {isError && (
                <div className="flex items-center gap-3 py-8 px-4 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">
                    Failed to load bookings: {(error as any)?.message ?? "Unknown error"}
                  </p>
                </div>
              )}

              {/* Data table */}
              {!isLoading && !isError && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Booking Code</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Client</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Photographer</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Property</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-16">
                              <div className="flex flex-col items-center gap-2 text-gray-500">
                                <Filter className="w-10 h-10 text-gray-300" />
                                <p className="font-medium">No bookings found</p>
                                <p className="text-sm">Try adjusting your search or filter criteria</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((row: any) => {
                            const b = row.booking ?? row;
                            return (
                            <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/bookings/${b.bookingCode}`)}>
                              <td className="py-3 px-4 font-mono text-sm font-semibold text-blue-600">{b.bookingCode}</td>
                              <td className="py-3 px-4 text-sm text-gray-900">{row.clientName ?? "—"}</td>
                              <td className="py-3 px-4 text-sm text-gray-900">{row.photographerName ?? "Unassigned"}</td>
                              <td className="py-3 px-4 text-sm text-gray-600 max-w-[180px] truncate">{b.propertyAddress ?? "—"}</td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                                ${(b.totalPrice ?? 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] ?? "bg-gray-100 text-gray-800"}`}>
                                  {(b.status ?? "unknown").replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/admin/bookings/${b.bookingCode}`); }}
                                  className="gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </Button>
                              </td>
                            </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
