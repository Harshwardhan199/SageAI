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
          SageAI is your intelligent chat assistant. Ask questions, build
          models, run tests, or create custom prompts.
        </div>
      </div>

      {/* Feature Cards */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 text-center text-xs text-secondary mt-6 px-4 w-full max-w-[550px] sm:max-w-none">
        {/* Card 1 */}
        <div className="flex flex-col flex-1 p-4 rounded-2xl bg-card-bg border border-default gap-2 shadow-sm hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-center">
            <img
              src={`https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=${accentHex}`}
              alt="Saved Prompts"
              className="w-[30px] h-[30px]"
            />
          </div>

          <div className="text-center text-sm font-semibold text-primary">
            Saved Prompt Templates
          </div>

          <div className="text-[11px] leading-relaxed">
            Users save and reuse prompt templates for faster responses.
          </div>
        </div>

        {/* Card 2 */}
        <div className="flex flex-col flex-1 p-4 rounded-2xl bg-card-bg border border-default gap-2 shadow-sm hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-center">
            <img
              src={`https://img.icons8.com/?size=100&id=54127&format=png&color=${accentHex}`}
              alt="Media"
              className="w-[30px] h-[30px]"
            />
          </div>

          <div className="text-center text-sm font-semibold text-primary">
            Media Type Selection
          </div>

          <div className="text-[11px] leading-relaxed">
            Users select media type for tailored interactions.
          </div>
        </div>

        {/* Card 3 */}
        <div className="flex flex-col flex-1 p-4 rounded-2xl bg-card-bg border border-default gap-2 shadow-sm hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-center">
            <img
              src={`https://img.icons8.com/?size=100&id=78888&format=png&color=${accentHex}`}
              alt="Language"
              className="w-[30px] h-[30px]"
            />
          </div>

          <div className="text-center text-sm font-semibold text-primary">
            Multilingual Support
          </div>

          <div className="text-[11px] leading-relaxed">
            Choose language for better interaction.
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-4 w-full mt-10 px-4">
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-secondary font-medium">
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
        </div>

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
