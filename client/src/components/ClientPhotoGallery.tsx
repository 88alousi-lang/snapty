import { useState } from "react";
import { Download, X, ZoomIn } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ClientPhotoGalleryProps {
  bookingId: number;
}

export function ClientPhotoGallery({ bookingId }: ClientPhotoGalleryProps) {
  const { data: gallery, isLoading } = trpc.storage.getGallery.useQuery({
    bookingId,
  });

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPhoto = async (url: string, filename: string) => {
    try {
      setDownloading(true);
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (error) {
      alert("Failed to download photo");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!gallery || gallery.length === 0) return;

    try {
      setDownloading(true);
      // Create a simple zip-like download (for MVP, just download all files)
      for (const photo of gallery) {
        await new Promise((resolve) => setTimeout(resolve, 200)); // Stagger downloads
        await handleDownloadPhoto(photo.url, photo.filename);
      }
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gallery || gallery.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-blue-900 font-medium">No photos available yet</p>
        <p className="text-blue-700 text-sm mt-1">
          Your photos will appear here once the photographer uploads them.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Delivered Photos
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {gallery.length} photo{gallery.length !== 1 ? "s" : ""} delivered
          </p>
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={downloading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download All
        </button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {gallery.map((photo) => (
          <div
            key={photo.key}
            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
          >
            <img
              src={photo.thumbnailUrl}
              alt={photo.filename}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setSelectedPhoto(photo.url)}
                className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDownloadPhoto(photo.url, photo.filename)}
                disabled={downloading}
                className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Full-screen Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedPhoto}
            alt="Full preview"
            className="max-w-4xl max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
