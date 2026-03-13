import { useState } from "react";
import { 
  DollarSign, Clock, CheckCircle2, AlertCircle, 
  ChevronLeft, ChevronRight, Loader2, Search, Filter, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PAGE_SIZE = 15;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function AdminPayouts() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const utils = trpc.useUtils();

  // We'll use getTransactions for now as a proxy for payouts if a specific payout router isn't fully ready
  // In a real app, we'd have trpc.admin.getPayouts
  const { data: transactions, isLoading, isError, error } = trpc.admin.getTransactions.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const statsQuery = trpc.admin.getStats.useQuery();
  const stats = statsQuery.data;

  // Unwrap server-paginated response
  const rows = transactions?.rows ?? [];
  const total = transactions?.total ?? 0;

  const filtered = rows.filter((t: any) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      !q || 
      (t.photographerName ?? "").toLowerCase().includes(q) ||
      (t.bookingCode ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
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
            <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
            <p className="text-sm text-gray-600 mt-1">Manage photographer earnings and payout requests</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Payouts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${parseFloat(String(stats?.totalRevenue ?? 0) || "0").toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pending Payouts</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg. Payout Time</p>
                  <p className="text-2xl font-bold text-gray-900">24h</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by photographer or booking code..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                  className="w-full pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {["all", "pending", "paid", "failed"].map(status => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(0); }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {status === "all" ? "All Payouts" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `Showing ${filtered.length} of ${total} transactions`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading payouts...</span>
                </div>
              )}

              {isError && (
                <div className="flex items-center gap-3 py-8 px-4 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">
                    Failed to load payouts: {(error as any)?.message ?? "Unknown error"}
                  </p>
                </div>
              )}

              {!isLoading && !isError && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Photographer</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Booking</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-16">
                              <div className="flex flex-col items-center gap-2 text-gray-500">
                                <Filter className="w-10 h-10 text-gray-300" />
                                <p className="font-medium">No payouts found</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((row: any) => (
                            <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.photographerName ?? "—"}</td>
                              <td className="py-3 px-4 font-mono text-sm text-blue-600">{row.bookingCode ?? "—"}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-3 px-4 text-sm font-bold text-gray-900">
                                ${parseFloat(String(row.amount ?? 0)).toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[row.status ?? "paid"] ?? "bg-gray-100 text-gray-800"}`}>
                                  {row.status ?? "paid"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Button size="sm" variant="ghost">Details</Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

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
