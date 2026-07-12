// components/home/main/PromptInput.jsx

const PromptInput = ({
  promptText,
  setPromptText,
  handlePrompt,
  onHitEnter,
  inputBarRef,
}) => {
  return (
    <div className="relative w-full rounded-lg bg-white text-black">
      {/* Logo */}
      <div className="absolute top-[6px] left-[2px]">
        <img
          src="/logo-nobg.png"
          alt="Logo"
          className="rounded-full w-[28px] h-auto"
        />
      </div>

      {/* Input */}
      <input
        type="text"
        placeholder="Ask Anything"
        className="h-[40px] w-full indent-8 outline-0"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        onKeyDown={onHitEnter}
        ref={inputBarRef}
      />

      {/* Attachment */}
      <div className="absolute top-[10px] right-[40px]">
        <img
          src="https://img.icons8.com/?size=100&id=jkqQE2I90I8R&format=png&color=1A1A1A"
          alt="Attachment"
          className="rounded-full w-[18px] h-auto cursor-pointer"
        />
      </div>

      {/* Send */}
      <div className="absolute top-[4px] right-[4px] bg-blue-600 p-1 rounded-lg">
        <img
          src="https://img.icons8.com/?size=100&id=7789&format=png&color=1A1A1A"
          alt="Send Prompt"
          className="invert rounded-full w-[24px] h-auto cursor-pointer"
          onClick={handlePrompt}
        />
      </div>
    </div>
  );
};

export default PromptInput;
