import { useLocation } from "wouter";
import { Loader2, FolderOpen, CheckCircle2, Clock, ImageIcon, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { EditorLayout } from "@/components/layouts/EditorLayout";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:        { label: "Pending",        color: "bg-yellow-100 text-yellow-800" },
  accepted:       { label: "Accepted",       color: "bg-blue-100 text-blue-800" },
  in_progress:    { label: "In Progress",    color: "bg-purple-100 text-purple-800" },
  photos_uploaded:{ label: "RAW Uploaded",   color: "bg-indigo-100 text-indigo-800" },
  editing:        { label: "Editing",        color: "bg-orange-100 text-orange-800" },
  delivered:      { label: "Delivered",      color: "bg-teal-100 text-teal-800" },
  completed:      { label: "Completed",      color: "bg-green-100 text-green-800" },
  cancelled:      { label: "Cancelled",      color: "bg-red-100 text-red-800" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", s.color)}>
      {s.label}
    </span>
  );
}

export default function EditorDashboard() {
  const [, navigate] = useLocation();

  const { data: bookings, isLoading, isError } = trpc.editorWorkflow.getMyBookings.useQuery();

  const active  = (bookings ?? []).filter((b: any) => ["photos_uploaded", "editing"].includes(b.status));
  const done    = (bookings ?? []).filter((b: any) => ["delivered", "completed"].includes(b.status));
  const pending = (bookings ?? []).filter((b: any) => !["delivered", "completed", "cancelled"].includes(b.status));

  return (
    <EditorLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Editor Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage your editing assignments</p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{active.length}</p>
                <p className="text-xs text-gray-500 font-medium">In Progress</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{pending.length}</p>
                <p className="text-xs text-gray-500 font-medium">Total Active</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{done.length}</p>
                <p className="text-xs text-gray-500 font-medium">Completed</p>
              </div>
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-gray-900">Active Assignments</h2>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {active.length} project{active.length !== 1 ? "s" : ""}
              </span>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
              </div>
            )}

            {isError && (
              <div className="flex items-center justify-center py-16 gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Failed to load assignments</span>
              </div>
            )}

            {!isLoading && !isError && active.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ImageIcon className="w-10 h-10 mb-3" />
                <p className="text-sm font-semibold">No active assignments</p>
                <p className="text-xs mt-1">Projects assigned by admin will appear here</p>
              </div>
            )}

            {active.map((booking: any) => (
              <ProjectRow
                key={booking.id}
                booking={booking}
                onClick={() => navigate(`/editor/project/${booking.id}`)}
                highlight
              />
            ))}
          </div>

          {/* All Assignments */}
          {pending.filter((b: any) => !["photos_uploaded", "editing"].includes(b.status)).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-extrabold text-gray-900">Other Assignments</h2>
              </div>
              {pending
                .filter((b: any) => !["photos_uploaded", "editing"].includes(b.status))
                .map((booking: any) => (
                  <ProjectRow
                    key={booking.id}
                    booking={booking}
                    onClick={() => navigate(`/editor/project/${booking.id}`)}
                  />
                ))}
            </div>
          )}

          {/* Completed */}
          {done.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-extrabold text-gray-900">Completed</h2>
              </div>
              {done.map((booking: any) => (
                <ProjectRow
                  key={booking.id}
                  booking={booking}
                  onClick={() => navigate(`/editor/project/${booking.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </EditorLayout>
  );
}

function ProjectRow({
  booking,
  onClick,
  highlight = false,
}: {
  booking: any;
  onClick: () => void;
  highlight?: boolean;
}) {
  const date = booking.scheduledDate ? new Date(booking.scheduledDate) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0",
        "hover:bg-gray-50 transition-colors text-left",
        highlight && "border-l-4 border-l-orange-400"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        highlight ? "bg-orange-50" : "bg-gray-100"
      )}>
        <FolderOpen className={cn("w-5 h-5", highlight ? "text-orange-500" : "text-gray-400")} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-gray-900 truncate">{booking.bookingCode}</span>
          <StatusBadge status={booking.status} />
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {booking.propertyAddress}
          {date && ` · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
        </p>
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
