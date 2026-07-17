import PromptInput from "./PromptInput";
import useTheme from "../../../hooks/useTheme";

const WelcomeScreen = ({
  promptText,
  setPromptText,
  handlePrompt,
  onHitEnter,
  inputBarRef,
  selectedImage,
  setSelectedImage,
  selectedAudio,
  setSelectedAudio,
}) => {
  const { accentColor } = useTheme();

  // Maps accent color names to Hex strings for Icons8 API
  const accentHexMap = {
    blue: "155dfc",
    purple: "8b5cf6",
    emerald: "10b981",
    orange: "f97316",
  };
  const accentHex = accentHexMap[accentColor] || "155dfc";

  return (
    <div className="w-full flex flex-col items-center pb-4">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center w-full gap-2 p-6 text-center mt-[10px]">
        <div>
          <img
            src="/logo.png"
            alt="Logo"
            className="rounded-full w-[40px] h-[40px]"
          />
        </div>

        <div className="text-2xl sm:text-3xl font-bold text-primary">
          How can I help you today?
        </div>

        <div className="text-xs text-secondary max-w-md">
          SageAI is your intelligent chat assistant. Ask questions, upload
          images, dictate with your voice, or save prompts for future
          conversations.
        </div>
      </div>

      {/* Feature Cards */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 text-center text-xs text-secondary mt-6 px-4 w-full max-w-[550px] sm:max-w-none">
        {/* Card 1 */}
        <div className="flex flex-col flex-1 p-4 rounded-2xl bg-card-bg border border-default gap-2 shadow-sm hover:border-accent/40 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-center justify-center">
            <img
              src={`https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=${accentHex}`}
              alt="Saved Prompt Templates"
              className="w-[30px] h-[30px]"
            />
          </div>

          <div className="text-center text-sm font-semibold text-primary">
            Saved Prompt Templates
          </div>

          <div className="text-[11px] leading-relaxed">
            Save and reuse your favorite prompts for faster, consistent AI
            interactions.
          </div>
        </div>

        {/* Card 2 */}
        <div className="flex flex-col flex-1 p-4 rounded-2xl bg-card-bg border border-default gap-2 shadow-sm hover:border-accent/40 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-center justify-center">
            <img
              src={`https://img.icons8.com/?size=100&id=6651&format=png&color=${accentHex}`}
              alt="Interactive Quiz"
              className="w-[30px] h-[30px]"
            />
          </div>

          <div className="text-center text-sm font-semibold text-primary">
            Interactive Quiz
          </div>

          <div className="text-[11px] leading-relaxed">
            Generate quizzes on any topic and learn through interactive
            AI-powered questions.
          </div>
        </div>

        {/* Card 3 */}
        <div className="flex flex-col flex-1 p-4 rounded-2xl bg-card-bg border border-default gap-2 shadow-sm hover:border-accent/40 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-center justify-center">
            <img
              src={`https://img.icons8.com/?size=100&id=ZNyAxEX9vDxS&format=png&color=${accentHex}`}
              alt="Voice Dictation"
              className="w-[30px] h-[30px]"
            />
          </div>

          <div className="text-center text-sm font-semibold text-primary">
            Voice Dictation
          </div>

          <div className="text-[11px] leading-relaxed">
            Speak naturally while SageAI converts your voice into editable text
            in real time.
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-4 w-full mt-10 px-4">
        {/* <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-secondary font-medium">
          <div className="hover:text-primary cursor-pointer transition-colors border-b-2 border-accent text-primary px-1">
            All
          </div>
          <div className="hover:text-primary cursor-pointer transition-colors px-1">
            Text
          </div>
          <div className="hover:text-primary cursor-pointer transition-colors px-1">
            Image
          </div>
          <div className="hover:text-primary cursor-pointer transition-colors px-1">
            Video
          </div>
          <div className="hover:text-primary cursor-pointer transition-colors px-1">
            Music
          </div>
          <div className="hover:text-primary cursor-pointer transition-colors px-1">
            Analytics
          </div>
        </div> */}

        <PromptInput
          promptText={promptText}
          setPromptText={setPromptText}
          handlePrompt={handlePrompt}
          onHitEnter={onHitEnter}
          inputBarRef={inputBarRef}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          selectedAudio={selectedAudio}
          setSelectedAudio={setSelectedAudio}
        />
      </div>
    </div>
  );
};

export default WelcomeScreen;
