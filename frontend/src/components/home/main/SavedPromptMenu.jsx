// components/home/main/SavedPromptMenu.jsx

import { useState, useEffect, useRef } from "react";

const SavedPromptMenu = ({ savedPrompts, TogglePinPrompt, DeletePrompt, onClose }) => {
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
      className="absolute right-0 top-[calc(100%+4px)] flex flex-col min-w-40 max-w-60 gap-1 text-left rounded-lg bg-[#141414] border-2 border-[#212121] drop-shadow"
    >
      {/* Header */}
      <div className="font-bold mt-2 ml-2 text-center">Saved Prompts</div>

      <div className="w-full h-[1px] bg-gray-300" />

      {savedPrompts.length > 0 ? (
        <>
          {/* Prompt List */}
          <div className="flex flex-col flex-1 min-h-30">
            {savedPrompts.map((promptData) => (
              <div
                key={promptData._id}
                className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-[#191919]"
              >
                {/* Left */}
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={
                      promptData.isPinned
                        ? "https://img.icons8.com/?size=100&id=7856&format=png&color=FFFFFF"
                        : "https://img.icons8.com/?size=100&id=104&format=png&color=ffffff"
                    }
                    alt="Pin"
                    className="shrink-0 w-3 h-3 cursor-pointer"
                    onClick={() => TogglePinPrompt(promptData._id)}
                  />

                  <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap truncate">
                    {promptData.text}
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-1 shrink-0">
                  <img
                    src={
                      copiedPromptId === promptData._id
                        ? "https://img.icons8.com/?size=100&id=98955&format=png&color=ffffff"
                        : "https://img.icons8.com/?size=100&id=pNYOTp5DinZ3&format=png&color=ffffff"
                    }
                    alt="Copy"
                    className="shrink-0 w-4 h-4 cursor-pointer"
                    onClick={() => handleCopy(promptData._id, promptData.text)}
                  />

                  <img
                    src="https://img.icons8.com/?size=100&id=14237&format=png&color=ffffff"
                    alt="Delete"
                    className="shrink-0 w-4 h-4 cursor-pointer"
                    onClick={() => DeletePrompt(promptData._id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* <div className="w-full h-[1px] bg-gray-300" />

          <div className="ml-2 mr-2 mb-2 text-sm text-center cursor-pointer hover:text-gray-300">
            Manage all
          </div> */}
        </>
      ) : (
        <div className="flex items-center justify-center min-h-30">
          <div className="text-center mb-1">No Prompts saved</div>
        </div>
      )}
    </div>
  );
};

export default SavedPromptMenu;
