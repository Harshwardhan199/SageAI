// components/home/main/TitleBar.jsx

import SavedPromptMenu from "./SavedPromptMenu";

const TitleBar = ({
  user,

  savedPrompts,
  showSavedPrompts,
  setShowSavedPrompts,

  TogglePinPrompt,
  DeletePrompt,

  handleLogOut,

  selectedModel,
  setSelectedModel,
}) => {
  return (
    <div className="sticky top-0 flex w-full justify-between items-center text-white pt-4 pr-8 pb-4 bg-[#030303] border-b border-b-[#151515] z-2">
      {/* Left */}
      <div className="flex items-center gap-4 pl-4">
        <div className="text-[20px] font-semibold bg-clip-text">SageAI</div>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-[#181818] text-[#c5c5c5] text-xs font-medium rounded-lg border border-[#2d2d2d] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block p-1.5 px-2.5 outline-none cursor-pointer hover:bg-[#222] transition-colors"
        >
          <option value="llama-3.3-70b-versatile">
            Llama 3.3 70B (Versatile)
          </option>
          <option value="openai/gpt-oss-120b">GPT-OSS 120B (Reasoning)</option>
          <option value="qwen/qwen3-32b">Qwen3 32B (Thinking)</option>
        </select>
      </div>

      {/* Logged In */}
      {user ? (
        <div className="flex items-center gap-3">
          <button className="relative h-[20px]">
            <img
              src="https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=000000"
              alt="Saved Prompts"
              className="saved-prompts-trigger invert w-[20px] h-auto cursor-pointer"
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

          {/* Future Share Button */}
          {/*
          <button className="h-[20px]">
            <img
              src="https://img.icons8.com/?size=100&id=g1EQCit0RQ7Z&format=png&color=1A1A1A"
              alt="Share"
              className="invert w-[18px] h-auto"
            />
          </button>
          */}
        </div>
      ) : (
        /* Guest */
        <button
          className="flex items-center justify-center gap-2 px-3 py-2 bg-[#272727] rounded-4xl"
          onClick={handleLogOut}
        >
          <div className="flex items-center justify-center h-[20px] w-[25px] flex-shrink-0">
            <img
              src="https://img.icons8.com/?size=100&id=98957&format=png&color=ffffff"
              alt="Profile"
              className="h-[25px] w-[25px]"
            />
          </div>

          <div className="flex items-center justify-center">Login</div>
        </button>
      )}
    </div>
  );
};

export default TitleBar;
