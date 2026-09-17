import PromptEditor from "./PromptEditor";

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
  onImagePreview,
}) => {
  return (
    <PromptEditor
      value={promptText}
      onChange={setPromptText}
      onSend={handlePrompt}
      inputRef={inputBarRef}
      selectedImage={selectedImage}
      setSelectedImage={setSelectedImage}
      selectedAudio={selectedAudio}
      setSelectedAudio={setSelectedAudio}
      onImagePreview={onImagePreview}
      showAttach={true}
      showMic={true}
    />
  );
};

export default PromptInput;
