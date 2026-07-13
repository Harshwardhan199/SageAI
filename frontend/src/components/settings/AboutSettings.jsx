const AboutSettings = () => {
  const version = "1.0.0";
  const buildDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 text-primary">
      {/* Brand Section */}
      <div className="flex flex-col items-center text-center p-4 bg-card-bg border border-default rounded-xl">
        <img
          src="/logo-nobg.png"
          alt="SageAI Logo"
          className="w-16 h-16 mb-3 theme-icon-dark object-contain"
        />
        <h2 className="text-xl font-bold">SageAI</h2>
        <p className="text-xs text-secondary mt-1">Your Intelligent Coding & Chat Companion</p>
      </div>

      {/* Info List */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center p-3 border-b border-default">
          <span className="text-sm text-secondary font-medium">Version</span>
          <span className="text-sm font-semibold">{version}</span>
        </div>
        <div className="flex justify-between items-center p-3 border-b border-default">
          <span className="text-sm text-secondary font-medium">Active Engine</span>
          <span className="text-sm font-semibold">React + Tailwind v4 + Vite</span>
        </div>
        <div className="flex justify-between items-center p-3 border-b border-default">
          <span className="text-sm text-secondary font-medium">Build Date</span>
          <span className="text-sm font-semibold">{buildDate}</span>
        </div>
        <div className="flex justify-between items-center p-3 border-b border-default">
          <span className="text-sm text-secondary font-medium">License</span>
          <span className="text-sm font-semibold">Proprietary</span>
        </div>
      </div>
    </div>
  );
};

export default AboutSettings;
