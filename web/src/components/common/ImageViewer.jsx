import { useEffect } from "react";
import { X } from "lucide-react";

const ImageViewer = ({ open, image, onClose }) => {
  useEffect(() => {
    if (!open) return;

    // ESC key listener
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Prevent background scrolling
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !image) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity duration-200 select-none image-viewer-backdrop"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-zinc-800/60 hover:bg-zinc-700/80 text-white rounded-full p-2.5 transition-colors cursor-pointer border-none outline-none z-10"
        title="Close Preview (ESC)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image Container with Pop Animation */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center p-4 image-viewer-content"
        onClick={(e) => e.stopPropagation()} // Stop propagation to avoid closing modal when clicking the image
      >
        <img
          src={image}
          alt="Preview"
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
        />
      </div>
    </div>
  );
};

export default ImageViewer;
