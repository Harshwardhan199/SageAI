const LoadingOverlay = ({ visible = false, message = "Initializing..." }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      aria-live="polite"
      aria-label="Loading"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md loading-overlay-backdrop" />

      {/* Card */}
      <div className="loading-overlay-card relative flex flex-col items-center gap-6 px-14 py-10 rounded-3xl bg-card-bg border border-default shadow-[0_8px_64px_rgba(0,0,0,0.5)] min-w-[220px]">
        {/* Logo + App name */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo-nobg.png"
            alt="SageAI"
            className="w-14 h-14 theme-icon-dark"
          />
          <span className="text-primary text-xl font-bold tracking-wide">
            SageAI
          </span>
        </div>

        {/* Spinner */}
        <div className="relative w-8 h-8">
          {/* Track */}
          <div className="absolute inset-0 rounded-full border-[2.5px] border-default" />
          {/* Accent arc */}
          <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-accent animate-spin" />
        </div>

        {/* Status text */}
        <p className="text-secondary text-xs font-medium tracking-widest uppercase">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
