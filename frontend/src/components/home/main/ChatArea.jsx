import Message from "../message/Message";
import WelcomeScreen from "./WelcomeScreen";
import PromptInput from "./PromptInput";

const ChatArea = ({
  messages,

  responseHeight,

  lastUserIndex,
  lastBotIndex,

  latestUserRef,
  latestBotRef,
  containerRef,

  promptText,
  setPromptText,

  inputBarRef,

  handlePrompt,
  onHitEnter,

  LoadSavedPrompts,

  selectedImage,
  setSelectedImage,
  selectedAudio,
  setSelectedAudio,
  onImagePreview,
}) => {
  return (
    <>
      {/* Content */}
      <div className={`flex flex-col w-full flex-1 mt-[1px] items-center px-1 sm:px-2 z-1 min-h-0 ${
        messages.length === 0 ? "justify-center" : "justify-start overflow-hidden"
      }`}>
        <div
          className={`flex max-w-[780px] w-full rounded-2xl overflow-hidden ${
            messages.length === 0 ? "bg-card-bg border border-default" : "flex-1 min-h-0 bg-transparent"
          }`}
        >
          <div
            ref={containerRef}
            className={`flex flex-col w-full px-2 pt-4 pb-2 ${
              messages.length === 0
                ? "items-center justify-start overflow-y-auto"
                : "overflow-y-auto flex-1 custom-scrollbar"
            }`}
          >
            {/* Welcome */}
            {messages.length === 0 && (
              <WelcomeScreen
                promptText={promptText}
                setPromptText={setPromptText}
                handlePrompt={handlePrompt}
                onHitEnter={onHitEnter}
                inputBarRef={inputBarRef}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                selectedAudio={selectedAudio}
                setSelectedAudio={setSelectedAudio}
                onImagePreview={onImagePreview}
              />
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <Message
                key={msg._id || idx}
                message={msg}
                loadSavedPrompts={LoadSavedPrompts}
                onImagePreview={onImagePreview}
                ref={
                  idx === lastUserIndex
                    ? latestUserRef
                    : idx === lastBotIndex
                      ? latestBotRef
                      : null
                }
              />
            ))}

            {/* Spacer to keep space occupied below the bot message */}
            {messages.length > 0 && lastBotIndex !== -1 && (
              <div style={{ height: `${responseHeight}px` }} />
            )}
          </div>
        </div>
      </div>

      {/* Sticky Input */}
      {messages.length > 0 && (
        <div className="sticky bottom-0 w-full h-[72px] bg-transparent z-2 px-3 relative flex justify-center">
          <div className="absolute bottom-7 max-w-[780px] w-full">
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
              onImagePreview={onImagePreview}
            />
          </div>
          <div className="absolute bottom-2 text-[10px] text-secondary font-medium select-none text-center">
            SageAI can make mistakes. Check important info.
          </div>
        </div>
      )}
    </>
  );
};

export default ChatArea;
