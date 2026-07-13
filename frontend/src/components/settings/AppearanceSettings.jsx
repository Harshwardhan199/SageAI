import useTheme from "../../hooks/useTheme";

const THEMES = [
  { id: "light", label: "Light", iconUrl: "https://img.icons8.com/?size=100&id=60002&format=png&color=000000" },
  { id: "dark", label: "Dark", iconUrl: "https://img.icons8.com/?size=100&id=bv1XgSVyIgCb&format=png&color=000000" },
  { id: "system", label: "System", iconUrl: "https://img.icons8.com/?size=100&id=15897&format=png&color=000000" },
];

const ACCENTS = [
  { id: "blue", label: "Blue", hex: "#155dfc" },
  { id: "purple", label: "Purple", hex: "#8b5cf6" },
  { id: "emerald", label: "Emerald", hex: "#10b981" },
  { id: "orange", label: "Orange", hex: "#f97316" },
];

const AppearanceSettings = () => {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  return (
    <div className="flex flex-col gap-6 text-primary">
      {/* Theme Section */}
      <div>
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
          Theme Mode
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ id, label, iconUrl }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                theme === id
                  ? "border-accent bg-accent/10 text-primary shadow-sm"
                  : "border-default bg-card-bg hover:bg-hover-bg text-secondary"
              }`}
            >
              <img
                src={iconUrl}
                alt={label}
                className="w-5 h-5 mb-1.5 theme-icon-dark"
              />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Section */}
      <div>
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
          Accent Color
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACCENTS.map(({ id, label, hex }) => (
            <button
              key={id}
              onClick={() => setAccentColor(id)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                accentColor === id
                  ? "border-accent bg-accent/10 text-primary shadow-sm font-semibold"
                  : "border-default bg-card-bg hover:bg-hover-bg text-secondary"
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-black/10 shadow-sm flex-shrink-0"
                style={{ backgroundColor: hex }}
              />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
