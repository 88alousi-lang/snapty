import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Users, Camera, DollarSign, Calendar, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { trpc } from "@/lib/trpc";

function ChangeIndicator({ change }: { change: string }) {
  const isPos = change.startsWith("+") && change !== "+0%";
  const isNeg = change.startsWith("-");
  if (isPos) return (
    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
      <TrendingUp className="w-3 h-3" /> {change} vs last month
    </span>
  );
  if (isNeg) return (
    <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
      <TrendingDown className="w-3 h-3" /> {change} vs last month
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
      <Minus className="w-3 h-3" /> no change vs last month
    </span>
  );
}

export default function AdminReports() {
  const [monthCount, setMonthCount] = useState<3 | 6 | 12>(6);

  const statsQuery   = trpc.admin.getStats.useQuery();
  const changesQuery = trpc.admin.getStatChanges.useQuery();
  const monthlyQuery = trpc.admin.getMonthlyStats.useQuery({ months: monthCount });

  const stats   = statsQuery.data;
  const changes = changesQuery.data;
  const monthly = monthlyQuery.data ?? [];

  const commissionRate     = 0.35;
  const totalRevenue       = stats?.totalRevenue ?? 0;
  const platformCommission = totalRevenue * commissionRate;
  const photographerPayouts = totalRevenue * (1 - commissionRate);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-600 mt-1">Live platform statistics</p>
              </div>
              <div className="flex gap-2">
                {([3, 6, 12] as const).map(n => (
                  <Button key={n} size="sm"
                    variant={monthCount === n ? "default" : "outline"}
                    onClick={() => setMonthCount(n)}
                    className={monthCount === n ? "bg-blue-600" : ""}
                  >{n}m</Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { title: "Total Revenue",    value: `$${totalRevenue.toLocaleString()}`, change: changes?.revenueChange ?? "—",       icon: DollarSign, color: "bg-green-100 text-green-600" },
              { title: "Total Bookings",   value: String(stats?.totalBookings ?? "—"),  change: changes?.bookingsChange ?? "—",      icon: Calendar,   color: "bg-blue-100 text-blue-600" },
              { title: "Photographers",    value: String(stats?.totalPhotographers ?? "—"), change: changes?.photographersChange ?? "—", icon: Camera, color: "bg-purple-100 text-purple-600" },
              { title: "Clients",          value: String(stats?.totalUsers ?? "—"),     change: changes?.usersChange ?? "—",         icon: Users,      color: "bg-orange-100 text-orange-600" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {statsQuery.isLoading
                            ? <span className="inline-block w-16 h-7 bg-gray-100 rounded animate-pulse" />
                            : stat.value}
                        </p>
                        <div className="mt-2">
                          {changesQuery.isLoading
                            ? <span className="inline-block w-24 h-4 bg-gray-100 rounded animate-pulse" />
                            : <ChangeIndicator change={stat.change} />}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Monthly Trends */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Monthly Trends
              </CardTitle>
              <CardDescription>Last {monthCount} months</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {["Month", "Revenue", "Bookings", "New Photographers", "MoM Revenue"].map(h => (
                          <th key={h} className="text-left py-3 px-4 font-semibold text-gray-900">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((row, i) => {
                        const prev = monthly[i - 1];
                        const momPct = prev && prev.revenue > 0
                          ? Math.round(((row.revenue - prev.revenue) / prev.revenue) * 100)
                          : null;
                        return (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-gray-900">{row.month} {row.year}</td>
                            <td className="py-3 px-4 text-gray-900">${row.revenue.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-900">{row.bookings}</td>
                            <td className="py-3 px-4 text-gray-900">{row.newPhotographers}</td>
                            <td className="py-3 px-4">
                              {momPct === null ? (
                                <span className="text-xs text-gray-400">—</span>
                              ) : momPct >= 0 ? (
                                <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                                  <TrendingUp className="w-4 h-4" />+{momPct}%
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-500 text-sm font-semibold">
                                  <TrendingDown className="w-4 h-4" />{momPct}%
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {monthly.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">No data yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Commission split</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: `Platform Commission (${Math.round(commissionRate * 100)}%)`, value: platformCommission, pct: commissionRate, color: "bg-blue-600" },
                    { label: `Photographer Payouts (${Math.round((1 - commissionRate) * 100)}%)`, value: photographerPayouts, pct: 1 - commissionRate, color: "bg-green-600" },
                  ].map(({ label, value, pct, color }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-sm font-bold text-gray-900">
                          ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Summary</CardTitle>
                <CardDescription>Live totals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statsQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                    ))
                  ) : (
                    [
                      { label: "Pending photographer approvals", value: stats?.pendingApprovals ?? 0 },
                      { label: "Photographers completed onboarding", value: stats?.completedOnboarding ?? 0 },
                      { label: "Revenue this month", value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}` },
                      { label: "Total bookings (all time)", value: stats?.totalBookings ?? 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        <p className="font-bold text-gray-900">{value}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
