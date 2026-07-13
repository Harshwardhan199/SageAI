import useTheme from "../../hooks/useTheme";

const ChatSettings = () => {
  const {
    autoScroll,
    setAutoScroll,
    showTimestamps,
    setShowTimestamps,
    enableMarkdown,
    setEnableMarkdown,
    animateAI,
    setAnimateAI,
  } = useTheme();

  const settingsOptions = [
    {
      id: "autoScroll",
      label: "Auto scroll",
      description: "Automatically scroll to the bottom when new messages arrive",
      checked: autoScroll,
      onChange: setAutoScroll,
    },
    {
      id: "showTimestamps",
      label: "Show timestamps",
      description: "Display message timestamps in the conversation thread",
      checked: showTimestamps,
      onChange: setShowTimestamps,
    },
    {
      id: "enableMarkdown",
      label: "Enable markdown rendering",
      description: "Render markdown styling, lists, tables, and images in responses",
      checked: enableMarkdown,
      onChange: setEnableMarkdown,
    },
    {
      id: "animateAI",
      label: "Animate AI responses",
      description: "Display responses with a typing/stream style animation effect",
      checked: animateAI,
      onChange: setAnimateAI,
    },
  ];

  return (
    <div className="flex flex-col gap-4 text-primary">
      <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-2">
        Chat Preferences
      </h3>

      <div className="flex flex-col gap-3">
        {settingsOptions.map(({ id, label, description, checked, onChange }) => (
          <label
            key={id}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-default bg-card-bg hover:bg-hover-bg/50 cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 rounded text-accent border-default focus:ring-accent accent-accent cursor-pointer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-secondary mt-0.5">{description}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ChatSettings;
