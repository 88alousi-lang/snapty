import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, Camera, BookOpen, DollarSign, BarChart3, Settings, LogOut, Shield, 
  AlertCircle, Loader2, RefreshCw, Save, X, Edit2, Trash2, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layouts/AdminLayout";

type Tab = "overview" | "photographers" | "users" | "bookings" | "payments" | "services";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // ─── Queries ───────────────────────────────────────────────────────────────
  const statsQuery = trpc.admin.getStats.useQuery();
  const bookingsQuery = trpc.admin.getBookings.useQuery({ limit: 5, offset: 0 });
  const servicesQuery = trpc.services.list.useQuery();
  const pricingQuery = trpc.services.pricingRules.useQuery();

  const utils = trpc.useUtils();

  // ─── Service mutations ──────────────────────────────────────────────────────
  const createServiceMutation = trpc.admin.createService.useMutation({
    onSuccess: () => {
      toast.success("Service created");
      utils.services.list.invalidate();
      setNewService({ name: "", description: "", serviceType: "base", basePrice: 0, deliveryTime: "" });
      setShowNewServiceForm(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const updateServiceMutation = trpc.admin.updateService.useMutation({
    onSuccess: () => { toast.success("Service updated"); utils.services.list.invalidate(); setEditingServiceId(null); },
    onError: (err) => toast.error(err.message),
  });
  const deleteServiceMutation = trpc.admin.deleteService.useMutation({
    onSuccess: () => { toast.success("Service deactivated"); utils.services.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  // ─── Pricing mutations ──────────────────────────────────────────────────────
  const createPricingMutation = trpc.admin.createPricingRule.useMutation({
    onSuccess: () => {
      toast.success("Pricing rule created");
      utils.services.pricingRules.invalidate();
      setNewPricing({ minSqft: 0, maxSqft: null, price: 0, label: "" });
      setShowNewPricingForm(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const updatePricingMutation = trpc.admin.updatePricingRule.useMutation({
    onSuccess: () => { toast.success("Pricing updated"); utils.services.pricingRules.invalidate(); setEditingPricingId(null); },
    onError: (err) => toast.error(err.message),
  });
  const deletePricingMutation = trpc.admin.deletePricingRule.useMutation({
    onSuccess: () => { toast.success("Pricing rule deleted"); utils.services.pricingRules.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  // ─── Local UI state ─────────────────────────────────────────────────────────
  const stats = statsQuery.data;
  const bookingRows = (bookingsQuery.data?.rows ?? []) as any[];

  // Service editing state
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editServiceData, setEditServiceData] = useState<{ name: string; description: string; basePrice: number; serviceType: "base" | "addon"; deliveryTime: string; isActive: boolean }>({ name: "", description: "", basePrice: 0, serviceType: "base", deliveryTime: "", isActive: true });
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newService, setNewService] = useState<{ name: string; description: string; serviceType: "base" | "addon"; basePrice: number; deliveryTime: string }>({ name: "", description: "", serviceType: "base", basePrice: 0, deliveryTime: "" });

  // Pricing editing state
  const [editingPricingId, setEditingPricingId] = useState<number | null>(null);
  const [editPricingData, setEditPricingData] = useState<{ price: number; label: string; minSqft: number; maxSqft: number | null }>({ price: 0, label: "", minSqft: 0, maxSqft: null });
  const [showNewPricingForm, setShowNewPricingForm] = useState(false);
  const [newPricing, setNewPricing] = useState<{ minSqft: number; maxSqft: number | null; price: number; label: string }>({ minSqft: 0, maxSqft: null, price: 0, label: "" });

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": case "completed": case "accepted": return "text-green-600 bg-green-50";
      case "pending": return "text-yellow-600 bg-yellow-50";
      case "cancelled": case "rejected": return "text-red-600 bg-red-50";
      case "in_progress": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const tabs: { id: Tab; label: string; icon: any; route?: string }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "photographers", label: "Photographers", icon: Camera, route: "/admin/photographers" },
    { id: "users", label: "Users", icon: Users, route: "/admin/clients" },
    { id: "bookings", label: "Bookings", icon: BookOpen, route: "/admin/bookings" },
    { id: "payments", label: "Payments", icon: DollarSign, route: "/admin/payouts" },
    { id: "services", label: "Services", icon: Settings },
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.route) {
      navigate(tab.route);
    } else {
      setActiveTab(tab.id);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Main Content */}
        <div className="flex-1 pb-20 md:pb-0">
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
            <div>
              <h1 className="text-xl font-bold text-gray-900 capitalize">{activeTab}</h1>
              <p className="text-sm text-gray-500">Snapty Admin Panel</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              statsQuery.refetch();
              bookingsQuery.refetch();
              servicesQuery.refetch();
              pricingQuery.refetch();
            }} className="rounded-xl gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>

          <div className="p-4 md:p-6">
            {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {statsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "blue", sub: "Registered clients", route: "/admin/clients" },
                        { label: "Photographers", value: stats?.totalPhotographers ?? 0, icon: Camera, color: "purple", sub: `${stats?.pendingApprovals ?? 0} pending`, route: "/admin/photographers" },
                        { label: "Total Bookings", value: stats?.totalBookings ?? 0, icon: BookOpen, color: "green", sub: "All time", route: "/admin/bookings" },
                        { label: "Revenue", value: `$${parseFloat(String(stats?.totalRevenue ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "yellow", sub: "Total collected", route: "/admin/reports" },
                      ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                          <div 
                            key={stat.label} 
                            className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(stat.route)}
                          >
                            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center mb-3`}>
                              <Icon className={`w-5 h-5 text-${stat.color}-500`} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs font-medium text-gray-600 mt-0.5">{stat.label}</p>
                            <p className="text-xs text-gray-400">{stat.sub}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Onboarding Funnel */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Photographer Onboarding</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 rounded-xl p-3">
                          <p className="text-xl font-bold text-green-700">{stats?.completedOnboarding ?? 0}</p>
                          <p className="text-xs text-green-600 font-medium">Completed all steps</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3">
                          <p className="text-xl font-bold text-orange-700">{stats?.incompleteOnboarding ?? 0}</p>
                          <p className="text-xs text-orange-600 font-medium">Incomplete onboarding</p>
                        </div>
                      </div>
                      {(stats?.totalPhotographers ?? 0) > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Completion rate</span>
                            <span>{Math.round(((stats?.completedOnboarding ?? 0) / (stats?.totalPhotographers ?? 1)) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${Math.round(((stats?.completedOnboarding ?? 0) / (stats?.totalPhotographers ?? 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pending Approval Alert */}
                    {(stats?.pendingApprovals ?? 0) > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">{stats?.pendingApprovals} photographer{(stats?.pendingApprovals ?? 0) > 1 ? "s" : ""} awaiting approval</p>
                            <p className="text-xs text-amber-600">Review and approve photographer profiles</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => navigate("/admin/photographers")} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                          Review
                        </Button>
                      </div>
                    )}

                    {/* Recent Bookings */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900">Recent Bookings</h3>
                        <button onClick={() => navigate("/admin/bookings")} className="text-xs text-blue-600 font-medium flex items-center gap-1">
                          View all
                        </button>
                      </div>
                      {bookingsQuery.isLoading ? (
                        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                      ) : bookingRows.length === 0 ? (
                        <p className="text-center text-gray-400 py-4 text-sm">No bookings yet</p>
                      ) : (
                        <div className="space-y-2">
                          {bookingRows.slice(0, 5).map((item: any) => {
                            const b = item.booking;
                            return (
                              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors" onClick={() => navigate(`/admin/bookings/${b.bookingCode}`)}>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{b.bookingCode}</p>
                                  <p className="text-xs text-gray-400">{item.clientName ?? "Client"}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-900">${parseFloat(String(b.totalPrice ?? 0)).toFixed(0)}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(b.status)}`}>{b.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── SERVICES ─────────────────────────────────────────────────────── */}
            {activeTab === "services" && (
              <div className="space-y-8">
                {/* Base Services & Addons */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Photography Services</h3>
                    <Button size="sm" onClick={() => setShowNewServiceForm(true)} className="rounded-xl gap-1.5 h-8">
                      <Plus className="w-3.5 h-3.5" /> New Service
                    </Button>
                  </div>

                  {showNewServiceForm && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Service Name *</label>
                          <input
                            value={newService.name}
                            onChange={(e) => setNewService(p => ({ ...p, name: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Type</label>
                          <select
                            value={newService.serviceType}
                            onChange={(e) => setNewService(p => ({ ...p, serviceType: e.target.value as any }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                          >
                            <option value="base">Base Photography</option>
                            <option value="addon">Add-on Service</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-600 mb-1 block">Description</label>
                          <textarea
                            value={newService.description}
                            onChange={(e) => setNewService(p => ({ ...p, description: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 h-20"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Base Price ($)</label>
                          <input
                            type="number"
                            value={newService.basePrice}
                            onChange={(e) => setNewService(p => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Delivery Time</label>
                          <input
                            value={newService.deliveryTime}
                            onChange={(e) => setNewService(p => ({ ...p, deliveryTime: e.target.value }))}
                            placeholder="e.g. 24-48 hours"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => createServiceMutation.mutate(newService)}
                          disabled={createServiceMutation.isPending || !newService.name}
                          className="rounded-xl gap-1.5"
                        >
                          {createServiceMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Create Service
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowNewServiceForm(false)} className="rounded-xl">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {servicesQuery.isLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                  ) : (
                    <div className="space-y-3">
                      {(servicesQuery.data ?? []).map((svc: any) => {
                        const isEditing = editingServiceId === svc.id;
                        return (
                          <div key={svc.id} className={`rounded-2xl border p-4 transition ${isEditing ? "border-blue-300 bg-blue-50" : "border-gray-100"}`}>
                            {isEditing ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="md:col-span-2">
                                    <label className="text-xs text-gray-600 mb-1 block">Service Name</label>
                                    <input
                                      value={editServiceData.name}
                                      onChange={(e) => setEditServiceData(p => ({ ...p, name: e.target.value }))}
                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Base Price ($)</label>
                                    <input
                                      type="number"
                                      value={editServiceData.basePrice}
                                      onChange={(e) => setEditServiceData(p => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))}
                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Delivery Time</label>
                                    <input
                                      value={editServiceData.deliveryTime}
                                      onChange={(e) => setEditServiceData(p => ({ ...p, deliveryTime: e.target.value }))}
                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateServiceMutation.mutate({ id: svc.id, ...editServiceData })}
                                    disabled={updateServiceMutation.isPending}
                                    className="rounded-xl gap-1.5"
                                  >
                                    {updateServiceMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingServiceId(null)} className="rounded-xl">
                                    <X className="w-4 h-4 mr-1" />Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-gray-900">{svc.name}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${svc.serviceType === "base" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                      {svc.serviceType}
                                    </span>
                                    {!svc.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-700">Inactive</span>}
                                  </div>
                                  <p className="text-xs text-gray-500 line-clamp-2 max-w-md">{svc.description}</p>
                                  <div className="flex gap-3 mt-2">
                                    <p className="text-xs font-bold text-gray-900">${parseFloat(String(svc.basePrice ?? 0)).toFixed(0)}</p>
                                    <p className="text-xs text-gray-400">{svc.deliveryTime}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingServiceId(svc.id);
                                      setEditServiceData({
                                        name: svc.name ?? "",
                                        description: svc.description ?? "",
                                        basePrice: parseFloat(String(svc.basePrice ?? 0)),
                                        serviceType: (svc.serviceType as any) ?? "base",
                                        deliveryTime: svc.deliveryTime ?? "",
                                        isActive: svc.isActive !== false
                                      });
                                    }}
                                    className="rounded-lg h-8 px-2"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (confirm(`Deactivate service "${svc.name}"?`)) {
                                        deleteServiceMutation.mutate({ id: svc.id });
                                      }
                                    }}
                                    disabled={deleteServiceMutation.isPending}
                                    className="rounded-lg h-8 px-2 text-red-600 border-red-100 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Square Footage Pricing Rules */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Square Footage Pricing Rules</h3>
                    <Button size="sm" onClick={() => setShowNewPricingForm(true)} className="rounded-xl gap-1.5 h-8">
                      <Plus className="w-3.5 h-3.5" /> New Rule
                    </Button>
                  </div>

                  {showNewPricingForm && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Label *</label>
                          <input
                            value={newPricing.label}
                            onChange={(e) => setNewPricing(p => ({ ...p, label: e.target.value }))}
                            placeholder="e.g. Up to 1,000 sqft"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Price ($) *</label>
                          <input
                            type="number"
                            value={newPricing.price}
                            onChange={(e) => setNewPricing(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Min sqft *</label>
                          <input
                            type="number"
                            value={newPricing.minSqft}
                            onChange={(e) => setNewPricing(p => ({ ...p, minSqft: parseInt(e.target.value) || 0 }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Max sqft (blank = unlimited)</label>
                          <input
                            type="number"
                            value={newPricing.maxSqft ?? ""}
                            onChange={(e) => setNewPricing(p => ({ ...p, maxSqft: e.target.value ? parseInt(e.target.value) : null }))}
                            placeholder="Leave blank for no limit"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => createPricingMutation.mutate(newPricing)}
                          disabled={createPricingMutation.isPending || !newPricing.label || newPricing.price <= 0}
                          className="rounded-xl gap-1.5"
                        >
                          {createPricingMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Create Rule
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowNewPricingForm(false)} className="rounded-xl">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {pricingQuery.isLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                  ) : (pricingQuery.data ?? []).length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm">No pricing rules yet</p>
                  ) : (
                    <div className="space-y-3">
                      {(pricingQuery.data ?? []).map((rule: any) => {
                        const isEditing = editingPricingId === rule.id;
                        return (
                          <div key={rule.id} className={`rounded-2xl border p-4 transition ${isEditing ? "border-blue-300 bg-blue-50" : "border-gray-100"}`}>
                            {isEditing ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Label</label>
                                    <input
                                      value={editPricingData.label}
                                      onChange={(e) => setEditPricingData(p => ({ ...p, label: e.target.value }))}
                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Price ($)</label>
                                    <input
                                      type="number"
                                      value={editPricingData.price}
                                      onChange={(e) => setEditPricingData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Min sqft</label>
                                    <input
                                      type="number"
                                      value={editPricingData.minSqft}
                                      onChange={(e) => setEditPricingData(p => ({ ...p, minSqft: parseInt(e.target.value) || 0 }))}
                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Max sqft</label>
                                    <input
                                      type="number"
                                      value={editPricingData.maxSqft ?? ""}
                                      onChange={(e) => setEditPricingData(p => ({ ...p, maxSqft: e.target.value ? parseInt(e.target.value) : null }))}
                                      placeholder="Blank = unlimited"
                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updatePricingMutation.mutate({ id: rule.id, ...editPricingData })}
                                    disabled={updatePricingMutation.isPending}
                                    className="rounded-xl gap-1.5"
                                  >
                                    {updatePricingMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingPricingId(null)} className="rounded-xl">
                                    <X className="w-4 h-4 mr-1" />Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{rule.label}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {rule.minSqft?.toLocaleString()} – {rule.maxSqft ? rule.maxSqft.toLocaleString() : "∞"} sqft
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="text-sm font-bold text-blue-600">${parseFloat(String(rule.price ?? 0)).toFixed(0)}</p>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingPricingId(rule.id);
                                        setEditPricingData({
                                          price: parseFloat(String(rule.price ?? 0)),
                                          label: rule.label ?? "",
                                          minSqft: rule.minSqft ?? 0,
                                          maxSqft: rule.maxSqft ?? null,
                                        });
                                      }}
                                      className="rounded-lg h-8 px-2"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (confirm(`Delete pricing rule "${rule.label}"?`)) {
                                          deletePricingMutation.mutate({ id: rule.id });
                                        }
                                      }}
                                      disabled={deletePricingMutation.isPending}
                                      className="rounded-lg h-8 px-2 text-red-600 border-red-100 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
