import React from "react";

const ConfirmationModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  confirmVariant = "danger", // "danger" | "primary"
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="flex flex-col gap-4 p-5 rounded-2xl bg-card-bg border border-default shadow-2xl w-full max-w-[420px] text-primary transition-all scale-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-default pb-3">
          <h3 className="font-bold text-base text-primary">{title}</h3>
          <button
            onClick={onCancel}
            className="text-secondary hover:text-primary transition-colors text-sm font-semibold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Message */}
        <div className="text-sm text-secondary leading-relaxed py-1">
          {message}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-default">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl hover:bg-hover-bg transition-colors text-secondary cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-colors shadow-sm cursor-pointer ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-accent hover:bg-accent-hover"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
