import { useState, useEffect, useRef } from "react";
import SavedPromptMenu from "./SavedPromptMenu";
import { useNavigate } from "react-router-dom";

const TitleBar = ({
  user,

  savedPrompts,
  showSavedPrompts,
  setShowSavedPrompts,

  TogglePinPrompt,
  DeletePrompt,

  selectedModel,
  setSelectedModel,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();

  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Model choices map for display labels
  const modelLabels = {
    "llama-3.3-70b-versatile": "Llama 3.3 70B",
    "openai/gpt-oss-120b": "GPT-OSS 120B",
    "qwen/qwen3-32b": "Qwen3 32B",
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectModel = (val) => {
    setSelectedModel(val);
    setShowModelDropdown(false);
  };

  return (
    <div className="sticky top-0 flex w-full justify-between items-center text-primary pt-4 pr-4 sm:pr-8 pb-4 bg-background/95 backdrop-blur-md border-b border-default z-2 transition-colors">
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4">
        {/* Hamburger Menu Trigger for Mobile/Tablet */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded-lg border border-default bg-card-bg hover:bg-hover-bg text-primary cursor-pointer transition-colors active:scale-95"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="text-lg sm:text-[20px] font-bold bg-clip-text text-primary">
          SageAI
        </div>

        {/* Custom Model Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center justify-between gap-1.5 bg-card-bg text-primary text-xs font-semibold rounded-xl border border-default p-2 px-3 outline-none cursor-pointer hover:bg-hover-bg hover:border-accent transition-all w-[155px] shadow-sm select-none"
          >
            <span className="truncate">
              {modelLabels[selectedModel] || "Select Model"}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-secondary transition-transform duration-200 ${
                showModelDropdown ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showModelDropdown && (
            <div className="absolute left-0 mt-1.5 w-[155px] bg-card-bg border border-default rounded-xl shadow-xl z-50 py-1.5 animate-fade-in text-primary">
              {Object.entries(modelLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => handleSelectModel(value)}
                  className={`w-full flex items-center justify-between text-left px-3.5 py-2 text-xs font-medium hover:bg-hover-bg transition-colors cursor-pointer ${
                    selectedModel === value
                      ? "text-accent bg-accent/10 font-bold"
                      : "text-primary"
                  }`}
                >
                  <span>{label}</span>
                  {selectedModel === value && (
                    <svg
                      className="w-3.5 h-3.5 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logged In */}
      {user ? (
        <div className="flex items-center gap-3">
          <button className="relative h-[20px] flex items-center">
            <img
              src="https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=000000"
              alt="Saved Prompts"
              className="saved-prompts-trigger theme-icon-dark w-[20px] h-auto cursor-pointer"
              onClick={() => setShowSavedPrompts(!showSavedPrompts)}
            />

            {showSavedPrompts && (
              <SavedPromptMenu
                savedPrompts={savedPrompts}
                TogglePinPrompt={TogglePinPrompt}
                DeletePrompt={DeletePrompt}
                onClose={() => setShowSavedPrompts(false)}
              />
            )}
          </button>
        </div>
      ) : (
        /* Guest */
        <button
          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-card-bg border border-default rounded-full text-primary hover:bg-hover-bg transition-colors cursor-pointer text-sm font-semibold shadow-sm"
          onClick={() => navigate("/loginSignUp")}
        >
          <div className="flex items-center justify-center h-[20px] w-[25px] flex-shrink-0">
            <img
              src="https://img.icons8.com/?size=100&id=98957&format=png&color=ffffff"
              alt="Profile"
              className="h-[20px] w-[20px] theme-icon-light"
            />
          </div>

          <div className="flex items-center justify-center">Login</div>
        </button>
      )}
    </div>
  );
};

export default TitleBar;
