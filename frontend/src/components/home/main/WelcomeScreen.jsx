// components/home/main/WelcomeScreen.jsx

import PromptInput from "./PromptInput";

const WelcomeScreen = ({
  promptText,
  setPromptText,
  handlePrompt,
  onHitEnter,
  inputBarRef,
}) => {
  return (
    <div>
      {/* Hero */}
      <div className="flex flex-col items-center justify-center w-full gap-2 p-8 text-center mt-[10px]">
        <div>
          <img
            src="/logo.png"
            alt="Logo"
            className="rounded-full w-[40px] h-auto"
          />
        </div>

        <div className="text-3xl text-white">How can I help you today?</div>

        <div className="text-[11.5px] text-[#969696]">
          This code will display a prompt asking the user for their name, and
          then it will display a greeting message with the name entered by the
          user.
        </div>
      </div>

      {/* Feature Cards */}
      <div className="flex items-center justify-center gap-2 text-center text-[10px] text-[#969696] mt-[10px]">
        {/* Card 1 */}
        <div className="flex flex-col h-[130px] w-[160px] p-3 rounded-xl bg-[#2d2d2d] gap-1">
          <div className="flex items-center justify-center">
            <img
              src="https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=155dfc"
              alt="Saved Prompts"
              className="w-[30px] h-auto"
            />
          </div>

          <div className="text-center text-[16px] leading-5 text-white">
            Saved Prompt Templates
          </div>

          <div>Users save and reuse prompt templates for faster responses.</div>
        </div>

        {/* Card 2 */}
        <div className="flex flex-col h-[130px] w-[160px] p-3 rounded-xl bg-[#2d2d2d] gap-1">
          <div className="flex items-center justify-center">
            <img
              src="https://img.icons8.com/?size=100&id=54127&format=png&color=155dfc"
              alt="Media"
              className="w-[30px] h-auto"
            />
          </div>

          <div className="text-center text-[16px] leading-5 text-white">
            Media Type Selection
          </div>

          <div>Users select media type for tailored interactions.</div>
        </div>

        {/* Card 3 */}
        <div className="flex flex-col h-[130px] w-[160px] p-3 rounded-xl bg-[#2d2d2d] gap-1">
          <div className="flex items-center justify-center">
            <img
              src="https://img.icons8.com/?size=100&id=78888&format=png&color=155dfc"
              alt="Language"
              className="w-[30px] h-auto"
            />
          </div>

          <div className="text-center text-[16px] leading-5 text-white">
            Multilingual Support
          </div>

          <div>Choose language for better interaction.</div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-2 w-full mt-12">
        <div className="flex justify-center gap-6 text-sm text-[#969696]">
          <div>All</div>
          <div>Text</div>
          <div>Image</div>
          <div>Video</div>
          <div>Music</div>
          <div>Analytics</div>
        </div>

        <PromptInput
          promptText={promptText}
          setPromptText={setPromptText}
          handlePrompt={handlePrompt}
          onHitEnter={onHitEnter}
          inputBarRef={inputBarRef}
        />
      </div>
    </div>
  );
};

export default WelcomeScreen;
