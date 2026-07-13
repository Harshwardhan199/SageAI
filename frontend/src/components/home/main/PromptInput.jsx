const PromptInput = ({
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
  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const onAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedAudio(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  return (
    <div className="relative w-full rounded-xl bg-[#fafafa] dark:bg-[#0d0d0d] text-primary shadow-lg border border-default dark:border-zinc-700 transition-all duration-200">
      {/* Hidden File Inputs */}
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        className="hidden"
        onChange={onImageChange}
      />
      <input
        type="file"
        id="audio-upload"
        accept="audio/*"
        className="hidden"
        onChange={onAudioChange}
      />

      {/* File Previews */}
      {(selectedImage || selectedAudio) && (
        <div className="flex flex-wrap gap-2 p-2 bg-hover-bg/30 border-b border-default rounded-t-xl">
          {selectedImage && (
            <div className="relative w-14 h-14 border border-default rounded-lg overflow-hidden group bg-hover-bg shadow-sm">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-black cursor-pointer font-bold transition-all"
              >
                ×
              </button>
            </div>
          )}
          {selectedAudio && (
            <div className="relative flex items-center gap-2 p-1.5 px-2.5 border border-default rounded-lg bg-hover-bg shadow-sm text-xs max-w-xs">
              <span className="text-[11px] text-primary font-medium truncate max-w-[120px]">
                🎵 Audio Attached
              </span>
              <button
                type="button"
                onClick={() => setSelectedAudio(null)}
                className="bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-black cursor-pointer font-bold transition-all"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input row wrapper */}
      <div className="relative flex items-center w-full">
        {/* File Input Trigger */}
        <div
          onClick={() => document.getElementById("image-upload").click()}
          className="absolute left-2 hover:bg-hover-bg p-2 rounded-lg cursor-pointer transition-colors"
        >
          <div className="flex justify-center items-center w-full h-full">
            <img
              src="https://img.icons8.com/?size=100&id=354k6pS0PoMI&format=png&color=1A1A1A"
              alt="File Input"
              className="w-[18px] h-auto dark:invert invert-0"
            />
          </div>
        </div>

        {/* Text Input */}
        <input
          type="text"
          placeholder="Ask Anything..."
          className="h-[44px] w-full pl-10 pr-24 outline-none rounded-xl text-xs sm:text-sm bg-transparent text-black dark:text-white placeholder:text-secondary"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={onHitEnter}
          ref={inputBarRef}
        />

        {/* Audio Input Trigger */}
        <div
          onClick={() => document.getElementById("audio-upload").click()}
          className="absolute right-12 hover:bg-hover-bg p-2 rounded-lg cursor-pointer transition-colors"
        >
          <img
            src="https://img.icons8.com/?size=100&id=jkqQE2I90I8R&format=png&color=1A1A1A"
            alt="Attachment"
            className="w-[18px] h-auto dark:invert invert-0"
          />
        </div>

        {/* Send Button */}
        <div
          onClick={handlePrompt}
          className="absolute right-2 bg-accent hover:bg-accent-hover p-2 rounded-lg cursor-pointer shadow-md transition-colors"
        >
          <img
            src="https://img.icons8.com/?size=100&id=7789&format=png&color=ffffff"
            alt="Send Prompt"
            className="w-[16px] h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
