import { useState, useEffect, useRef } from "react";

const SavedPromptMenu = ({
  savedPrompts,
  TogglePinPrompt,
  DeletePrompt,
  onClose,
}) => {
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (!event.target.closest(".saved-prompts-trigger")) {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleCopy = (promptId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(promptId);
    setTimeout(() => {
      setCopiedPromptId(null);
    }, 1000);
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-[calc(100%+8px)] flex flex-col w-64 sm:w-72 gap-1 text-left rounded-2xl bg-card-bg border border-default shadow-2xl z-30 text-primary transition-all duration-200"
    >
      {/* Header */}
      <div className="font-bold py-3 text-center text-[10px] tracking-widest text-secondary uppercase select-none">
        Saved Prompts
      </div>

      <div className="w-full h-[1px] bg-default" />

      {savedPrompts.length > 0 ? (
        <>
          {/* Prompt List */}
          <div className="flex flex-col flex-1 py-1 max-h-[240px] overflow-y-auto custom-scrollbar">
            {savedPrompts.map((promptData) => (
              <div
                key={promptData._id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-hover-bg transition-colors"
              >
                {/* Left (flex-1 to push the right-side options) */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={
                      promptData.isPinned
                        ? "https://img.icons8.com/?size=100&id=7856&format=png&color=FFFFFF"
                        : "https://img.icons8.com/?size=100&id=104&format=png&color=ffffff"
                    }
                    alt="Pin"
                    className="shrink-0 w-3.5 h-3.5 cursor-pointer theme-icon-light hover:scale-115 transition-transform duration-200"
                    onClick={() => TogglePinPrompt(promptData._id)}
                  />

                  <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap truncate text-xs font-semibold text-primary">
                    {promptData.text}
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0">
                  <img
                    src={
                      copiedPromptId === promptData._id
                        ? "https://img.icons8.com/?size=100&id=98955&format=png&color=ffffff"
                        : "https://img.icons8.com/?size=100&id=pNYOTp5DinZ3&format=png&color=ffffff"
                    }
                    alt="Copy"
                    className="shrink-0 w-4 h-4 cursor-pointer theme-icon-light hover:scale-115 transition-transform duration-200"
                    onClick={() => handleCopy(promptData._id, promptData.text)}
                  />

                  <img
                    src="https://img.icons8.com/?size=100&id=14237&format=png&color=ffffff"
                    alt="Delete"
                    className="shrink-0 w-4 h-4 cursor-pointer theme-icon-light hover:scale-115 transition-transform duration-200"
                    onClick={() => DeletePrompt(promptData._id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-30">
          <div className="text-center mb-1 text-xs text-secondary font-medium select-none">No Prompts saved</div>
        </div>
      )}
    </div>
  );
};

export default SavedPromptMenu;
