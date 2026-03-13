import { useState } from "react";
import { Upload, X, Check, Download, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface EditorEditedUploadProps {
  bookingId: number;
  onSuccess?: () => void;
}

export function EditorEditedUpload({
  bookingId,
  onSuccess,
}: EditorEditedUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showRawPhotos, setShowRawPhotos] = useState(false);

  const { data: rawPhotos, isLoading: loadingRaw } =
    trpc.storage.getRawPhotos.useQuery(
      { bookingId },
      { enabled: showRawPhotos }
    );

  const uploadEdited = trpc.storage.uploadEdited.useMutation({
    onSuccess: (data, variables) => {
      setUploadedFiles((prev) => [...prev, variables.filename]);
    },
    onError: (error) => {
      alert(`Upload failed: ${error.message}`);
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-green-500", "bg-green-50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-green-500", "bg-green-50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-green-500", "bg-green-50");
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select at least one file");
      return;
    }

    setUploading(true);

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        await uploadEdited.mutateAsync({
          bookingId,
          filename: file.name,
          fileBuffer: new Uint8Array(buffer) as any,
          contentType: file.type,
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    setUploading(false);
    setFiles([]);
    onSuccess?.();
  };

  const handleDownloadRaw = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (error) {
      alert("Failed to download file");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Edited Photos
        </h3>
        <p className="text-sm text-gray-600">
          Upload your edited photos. These will be delivered to the client.
        </p>
      </div>

      {/* View Raw Photos Button */}
      <button
        onClick={() => setShowRawPhotos(!showRawPhotos)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        <Eye className="w-4 h-4" />
        {showRawPhotos ? "Hide" : "View"} Raw Photos
      </button>

      {/* Raw Photos List */}
      {showRawPhotos && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-blue-900">Raw Photos Available</p>
          {loadingRaw ? (
            <p className="text-sm text-blue-700">Loading...</p>
          ) : rawPhotos && rawPhotos.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rawPhotos.map((photo) => (
                <div
                  key={photo.key}
                  className="flex items-center justify-between bg-white p-3 rounded border border-blue-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {photo.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(photo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDownloadRaw(photo.url, photo.filename)
                    }
                    className="text-blue-600 hover:text-blue-700 p-2"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-blue-700">No raw photos uploaded yet</p>
          )}
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-green-500 hover:bg-green-50"
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium mb-1">
          Drag and drop edited photos here
        </p>
        <p className="text-sm text-gray-500 mb-4">or</p>
        <label className="inline-block">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <span className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
            Select Files
          </span>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {files.length} file{files.length !== 1 ? "s" : ""} to upload
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {uploadedFiles.includes(file.name) ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {uploading
          ? "Uploading..."
          : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
      </button>

      {uploadedFiles.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            ✓ {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""}{" "}
            uploaded successfully
          </p>
        </div>
      )}
    </div>
  );
}
