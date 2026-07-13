// components/home/main/ChatArea.jsx

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
}) => {
  return (
    <>
      {/* Content */}
      <div className="flex flex-col w-full flex-1 mt-[1px] items-center justify-center px-2 overflow-y-auto z-1">
        <div
          className={`flex max-w-[780px] w-full min-w-[600px] rounded-2xl overflow-hidden ${
            messages.length === 0 ? "bg-[#161616]" : "h-full bg-transparent"
          }`}
        >
          <div
            ref={containerRef}
            className={`flex flex-col w-full px-2 pt-4 pb-2 overflow-y-auto ${
              messages.length === 0 ? "items-center justify-start" : ""
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
              />
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <Message
                key={msg._id || idx}
                sender={msg.sender}
                text={msg.text}
                loadSavedPrompts={LoadSavedPrompts}
                style={{
                  minHeight:
                     idx === lastBotIndex ? `${responseHeight}px` : "auto",
                }}
                ref={
                  idx === lastUserIndex
                    ? latestUserRef
                    : idx === lastBotIndex
                      ? latestBotRef
                      : null
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Input */}
      {messages.length > 0 && (
        <div className="sticky bottom-0 flex flex-col items-center w-full h-17 bg-black z-2">
          <div className="relative flex justify-center w-full">
            <div className="absolute -top-2 max-w-[780px] w-full min-w-[600px]">
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

            <div className="absolute top-10 text-[12px] text-white">
              SageAI can make mistakes. Check important info.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatArea;
