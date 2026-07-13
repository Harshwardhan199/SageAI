// components/home/main/PromptInput.jsx

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
    <div className="relative w-full rounded-lg bg-white text-black shadow-lg border border-gray-200">
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
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 border-b border-gray-100 rounded-t-lg">
          {selectedImage && (
            <div className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden group bg-gray-100 shadow-sm">
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
            <div className="relative flex items-center gap-2 p-2 px-3 border border-gray-200 rounded-lg bg-gray-100 shadow-sm text-xs max-w-xs">
              <span className="text-[11px] text-gray-700 font-medium truncate max-w-[120px]">
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
          className="absolute left-2.5 hover:bg-gray-300 p-1.5 rounded-lg cursor-pointer transition-colors"
        >
          <div className="flex justify-center items-center w-full h-full">
            <img
              src="https://img.icons8.com/?size=100&id=354k6pS0PoMI&format=png&color=1A1A1A"
              alt="File Input"
              className="w-[18px] h-auto"
            />
          </div>
        </div>

        {/* Text Input */}
        <input
          type="text"
          placeholder="Ask Anything..."
          className="h-[44px] w-full pl-11 pr-20 outline-none rounded-lg text-sm bg-transparent"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={onHitEnter}
          ref={inputBarRef}
        />

        {/* Audio Input Trigger */}
        <div
          onClick={() => document.getElementById("audio-upload").click()}
          className="absolute right-11 hover:bg-gray-100 p-1.5 rounded-lg cursor-pointer transition-colors"
        >
          <img
            src="https://img.icons8.com/?size=100&id=jkqQE2I90I8R&format=png&color=1A1A1A"
            alt="Attachment"
            className="w-[18px] h-auto"
          />
        </div>

        {/* Send Button */}
        <div
          onClick={handlePrompt}
          className="absolute right-2 bg-blue-600 hover:bg-blue-700 p-1.5 rounded-lg cursor-pointer shadow-md transition-colors"
        >
          <img
            src="https://img.icons8.com/?size=100&id=7789&format=png&color=ffffff"
            alt="Send Prompt"
            className="w-[18px] h-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
