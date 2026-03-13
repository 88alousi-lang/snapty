import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Eye, Mail, Phone, Users, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { trpc } from "@/lib/trpc";

const PAGE_SIZE = 12;

export default function AdminClients() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading, isError, error } = trpc.admin.getUsers.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  // Unwrap server-paginated response
  const userRows = users?.rows ?? [];
  const total = users?.total ?? 0;

  // Filter to clients only, then apply search
  const clients = userRows.filter((u: any) => u.role === "user");
  const filtered = clients.filter((u: any) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-sm text-gray-600 mt-1">Manage and view all registered clients</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading clients...</span>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex items-center gap-3 py-8 px-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">
                Failed to load clients: {(error as any)?.message ?? "Unknown error"}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Users className="w-14 h-14 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No clients found</p>
              <p className="text-sm mt-1">
                {searchTerm ? "Try a different search term" : "No clients have registered yet"}
              </p>
            </div>
          )}

          {/* Clients Grid */}
          {!isLoading && !isError && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filtered.map((client: any) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{client.name ?? "—"}</h3>
                          <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <a href={`mailto:${client.email}`} className="hover:text-blue-600 truncate">
                            {client.email ?? "—"}
                          </a>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            {client.phone}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mb-3">
                        Joined {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "—"}
                      </p>

                      <Button
                        size="sm"
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                        View Profile
                      </Button>
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
