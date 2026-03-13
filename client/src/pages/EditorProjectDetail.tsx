import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, Download, Upload, CheckCircle2, Loader2, AlertCircle,
  ImageIcon, FileUp, Eye, Clock, MapPin, Calendar, FolderOpen,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EditorLayout } from "@/components/layouts/EditorLayout";
import { Button } from "@/components/ui/button";

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  photos_uploaded: { label: "RAW Ready",  color: "bg-indigo-100 text-indigo-800" },
  editing:         { label: "Editing",    color: "bg-orange-100 text-orange-800" },
  delivered:       { label: "Delivered",  color: "bg-teal-100 text-teal-800" },
  completed:       { label: "Completed",  color: "bg-green-100 text-green-800" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  return <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", s.color)}>{s.label}</span>;
}

// ─── File size formatter ───────────────────────────────────────────────────────
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function EditorProjectDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/editor/project/:bookingId");
  const bookingId = params?.bookingId ? parseInt(params.bookingId) : 0;

  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data, isLoading, isError } = trpc.editorWorkflow.getBookingDetail.useQuery(
    { bookingId },
    { enabled: bookingId > 0 }
  );

  const uploadMutation = trpc.storage.uploadEdited.useMutation({
    onSuccess: () => {
      utils.editorWorkflow.getBookingDetail.invalidate({ bookingId });
    },
    onError: (err: any) => toast.error(err.message ?? "Upload failed"),
  });

  const markDeliveredMutation = trpc.editorWorkflow.markDelivered.useMutation({
    onSuccess: () => {
      toast.success("Project marked as delivered! Client has been notified.");
      utils.editorWorkflow.getMyBookings.invalidate();
      utils.editorWorkflow.getBookingDetail.invalidate({ bookingId });
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to mark delivered"),
  });

  // ─── Upload handler ──────────────────────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploadingFiles(fileArray.map((f) => ({ name: f.name, progress: 0 })));

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        // Read as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // strip data:...;base64,
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setUploadingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 50 } : f))
        );

        await uploadMutation.mutateAsync({
          bookingId,
          filename: file.name,
          fileBase64: base64,
          contentType: file.type || "image/jpeg",
        });

        setUploadingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 100 } : f))
        );

        toast.success(`${file.name} uploaded`);
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
        setUploadingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: -1 } : f))
        );
      }
    }

    // Clear progress after short delay
    setTimeout(() => setUploadingFiles([]), 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ─── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <EditorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      </EditorLayout>
    );
  }

  if (isError || !data) {
    return (
      <EditorLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-red-500">
          <AlertCircle className="w-8 h-8" />
          <p className="font-medium">Project not found or access denied</p>
          <button onClick={() => navigate("/editor/dashboard")} className="text-sm text-gray-500 underline">
            Back to dashboard
          </button>
        </div>
      </EditorLayout>
    );
  }

  const { booking, rawPhotos } = data;
  const canDeliver = ["editing", "photos_uploaded"].includes(booking.status);
  const isDelivered = ["delivered", "completed"].includes(booking.status);
  const schedDate = booking.scheduledDate ? new Date(booking.scheduledDate) : null;

  return (
    <EditorLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => navigate("/editor/dashboard")}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-extrabold text-gray-900">{booking.bookingCode}</h1>
                <StatusBadge status={booking.status} />
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{booking.propertyAddress}</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Booking info card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-extrabold text-gray-900 mb-4">Project Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-semibold text-gray-900">{booking.propertyAddress}</p>
                </div>
              </div>
              {schedDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Shoot Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {schedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
              {booking.propertyType && (
                <div className="flex items-start gap-2">
                  <FolderOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Property Type</p>
                    <p className="text-sm font-semibold text-gray-900">{booking.propertyType}</p>
                  </div>
                </div>
              )}
              {booking.propertySize && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Property Size</p>
                    <p className="text-sm font-semibold text-gray-900">{booking.propertySize.toLocaleString()} sqft</p>
                  </div>
                </div>
              )}
            </div>
            {booking.specialInstructions && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Special Instructions</p>
                <p className="text-sm text-gray-700">{booking.specialInstructions}</p>
              </div>
            )}
          </div>

          {/* RAW Photos Download */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-gray-900">RAW Photos from Photographer</h2>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {rawPhotos.length} file{rawPhotos.length !== 1 ? "s" : ""}
              </span>
            </div>

            {rawPhotos.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <ImageIcon className="w-9 h-9 mb-2" />
                <p className="text-sm font-semibold">No RAW photos uploaded yet</p>
                <p className="text-xs mt-1">Waiting for photographer to upload</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rawPhotos.map((photo: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{photo.filename}</p>
                        <p className="text-xs text-gray-400">{fmtSize(photo.size)}</p>
                      </div>
                    </div>
                    <a
                      href={photo.url}
                      download={photo.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                ))}

                {/* Download all button */}
                {rawPhotos.length > 1 && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        rawPhotos.forEach((p: any) => {
                          const a = document.createElement("a");
                          a.href = p.url;
                          a.download = p.filename;
                          a.target = "_blank";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download All RAW Files ({rawPhotos.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Edited Photos */}
          {!isDelivered && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">Upload Edited Photos</h2>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                )}
              >
                <Upload className={cn("w-8 h-8 mx-auto mb-2", isDragging ? "text-primary" : "text-gray-300")} />
                <p className="text-sm font-bold text-gray-700">
                  {isDragging ? "Drop files here" : "Drag & drop edited photos here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">or click to select files</p>
                <p className="text-xs text-gray-300 mt-2">JPG, PNG, TIFF, WebP supported</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.tiff,.tif"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {/* Upload progress */}
              {uploadingFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadingFiles.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{f.name}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              f.progress === -1 ? "bg-red-500" : f.progress === 100 ? "bg-green-500" : "bg-blue-500"
                            )}
                            style={{ width: `${Math.max(0, f.progress)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {f.progress === -1 ? "Failed" : f.progress === 100 ? "Done" : `${f.progress}%`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mark as Delivered */}
          {canDeliver && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-extrabold text-gray-900 mb-2">Finalize Project</h2>
              <p className="text-xs text-gray-500 mb-4">
                Once you're done editing and have uploaded all final photos, mark the project as delivered.
                The client will be notified immediately.
              </p>
              <Button
                onClick={() => markDeliveredMutation.mutate({ bookingId })}
                disabled={markDeliveredMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors h-12"
              >
                {markDeliveredMutation.isPending
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <CheckCircle2 className="w-5 h-5" />
                }
                Mark as Delivered
              </Button>
            </div>
          )}

          {/* Delivered state */}
          {isDelivered && (
            <div className="bg-green-50 rounded-2xl border border-green-200 p-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-extrabold text-green-800">Project Delivered</p>
                <p className="text-xs text-green-600 mt-0.5">Photos have been delivered to the client.</p>
              </div>
            </div>
          )}

          {/* Back button */}
          <button
            onClick={() => navigate("/editor/dashboard")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </EditorLayout>
  );
}
