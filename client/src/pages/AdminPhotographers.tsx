import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Eye, CheckCircle2, XCircle, AlertTriangle, Loader2, Camera, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { trpc } from "@/lib/trpc";

const PAGE_SIZE = 12;

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminPhotographers() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | null;
    photographerId: string;
    photographerName: string;
  }>({ open: false, action: null, photographerId: "", photographerName: "" });

  const utils = trpc.useUtils();

  const { data: photographers, isLoading, isError, error } = trpc.admin.getPhotographers.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const approveRejectMutation = trpc.admin.approvePhotographer.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.approve ? "Photographer approved successfully" : "Photographer rejected");
      utils.admin.getPhotographers.invalidate();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update photographer status"),
    onSettled: () => {
      setConfirmDialog({ open: false, action: null, photographerId: "", photographerName: "" });
    },
  });

  // Unwrap server-paginated response
  const rows = photographers?.rows ?? [];
  const total = photographers?.total ?? 0;

  const filtered = rows.filter((p: any) => {
    const ph = p.photographer ?? p;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      (p.userName ?? ph.name ?? "").toLowerCase().includes(q) ||
      (p.userEmail ?? ph.email ?? "").toLowerCase().includes(q);
    const isApproved = ph.isApproved;
    const phStatus = isApproved ? "approved" : (ph.isVerified === false ? "rejected" : "pending");
    const matchesStatus = statusFilter === "all" || phStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  const handleConfirmAction = () => {
    if (!confirmDialog.action || !confirmDialog.photographerId) return;
    if (approveRejectMutation.isPending) return;
    approveRejectMutation.mutate({
      photographerId: parseInt(confirmDialog.photographerId),
      approve: confirmDialog.action === "approve",
    });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Photographers</h1>
            <p className="text-sm text-gray-600 mt-1">Manage photographers and approve applications</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                className="pl-10"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex gap-2 flex-wrap">
              {["all", "approved", "pending", "rejected"].map(status => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(0); }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Confirmation Dialog */}
          <Dialog
            open={confirmDialog.open}
            onOpenChange={(open) => !approveRejectMutation.isPending && setConfirmDialog(prev => ({ ...prev, open }))}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${confirmDialog.action === "approve" ? "text-green-600" : "text-red-600"}`} />
                  {confirmDialog.action === "approve" ? "Approve Photographer" : "Reject Photographer"}
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to <strong>{confirmDialog.action}</strong>{" "}
                  <strong>{confirmDialog.photographerName}</strong>?
                  {confirmDialog.action === "reject" && (
                    <span className="block mt-2 text-red-600 text-sm">
                      This will prevent them from receiving new bookings.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDialog({ open: false, action: null, photographerId: "", photographerName: "" })}
                  disabled={approveRejectMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAction}
                  disabled={approveRejectMutation.isPending}
                  className={confirmDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {approveRejectMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    confirmDialog.action === "approve" ? "Yes, Approve" : "Yes, Reject"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading photographers...</span>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex items-center gap-3 py-8 px-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">
                Failed to load photographers: {(error as any)?.message ?? "Unknown error"}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Camera className="w-14 h-14 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No photographers found</p>
              <p className="text-sm mt-1">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter"
                  : "No photographers have applied yet"}
              </p>
            </div>
          )}

          {/* Photographers Grid */}
          {!isLoading && !isError && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filtered.map((row: any) => {
                  const ph = row.photographer ?? row;
                  const phStatus = ph.isApproved ? "approved" : (ph.isVerified === false ? "rejected" : "pending");
                  return (
                  <Card key={ph.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{row.userName ?? ph.name ?? "—"}</h3>
                          <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[phStatus] ?? "bg-gray-100 text-gray-800"}`}>
                            {phStatus.charAt(0).toUpperCase() + phStatus.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 mb-4">
                        <p className="text-sm text-gray-600">{row.userEmail ?? ph.email ?? "—"}</p>
                        {ph.city && (
                          <p className="text-sm text-gray-500">{ph.city}</p>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mb-3">
                        Joined {ph.createdAt ? new Date(ph.createdAt).toLocaleDateString() : "—"}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => navigate(`/admin/photographers/${ph.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        {phStatus === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                              onClick={() => setConfirmDialog({
                                open: true, action: "approve",
                                photographerId: String(ph.id),
                                photographerName: row.userName ?? ph.name ?? "this photographer",
                              })}
                              disabled={approveRejectMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setConfirmDialog({
                                open: true, action: "reject",
                                photographerId: String(ph.id),
                                photographerName: row.userName ?? ph.name ?? "this photographer",
                              })}
                              disabled={approveRejectMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
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
