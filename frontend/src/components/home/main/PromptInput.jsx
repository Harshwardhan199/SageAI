import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "react-toastify";

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
  const [isListening, setIsListening] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const singleLineHeightRef = useRef(36); // default fallback

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  const recognitionRef = useRef(null);
  const stableTextRef = useRef(promptText);
  const currentResultsLengthRef = useRef(0);
  const lastProcessedFinalIndexRef = useRef(-1);

  // Auto-resize the textarea height based on content
  const adjustHeight = () => {
    const textarea = inputBarRef.current;
    if (!textarea) return;

    // Reset height to auto to measure scrollHeight correctly
    textarea.style.height = "auto";

    // Read the scrollHeight
    const scrollHeight = textarea.scrollHeight;

    // Dynamically learn the single-line scroll height when the text is empty
    if (textarea.value === "" && scrollHeight > 0) {
      singleLineHeightRef.current = scrollHeight;
    }

    const minHeight = singleLineHeightRef.current;
    const maxHeight = 200; // max 9-10 lines

    const hasNewline = textarea.value.includes("\n");
    // Trigger multi-line layout only if a newline exists or scrollHeight exceeds single-line height with a buffer
    const isMulti = hasNewline || scrollHeight > singleLineHeightRef.current + 6;
    setIsMultiLine(isMulti);

    // Clamp the height between minHeight and maxHeight
    const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

    // Apply the height
    textarea.style.height = `${targetHeight}px`;

    // Handle vertical scrolling after reaching max height
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }
  };

  // Adjust height on text changes (covers typing, speech-to-text, templates, sends)
  useEffect(() => {
    adjustHeight();
  }, [promptText]);

  // Adjust height on window resize
  useEffect(() => {
    window.addEventListener("resize", adjustHeight);
    return () => {
      window.removeEventListener("resize", adjustHeight);
    };
  }, []);

  // Sync stableTextRef and indices when prompt is cleared
  useEffect(() => {
    if (promptText === "") {
      stableTextRef.current = "";
      lastProcessedFinalIndexRef.current = -1;
      currentResultsLengthRef.current = 0;
    }
  }, [promptText]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!isSupported) {
      toast.error("Live speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (isPermissionDenied) {
      toast.error("Microphone permission was denied. Please enable it in browser settings.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        stableTextRef.current = promptText;
        lastProcessedFinalIndexRef.current = -1;
        currentResultsLengthRef.current = 0;
      };

      rec.onresult = (event) => {
        currentResultsLengthRef.current = event.results.length;
        
        let newFinals = "";
        let currentInterim = "";
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            if (i > lastProcessedFinalIndexRef.current) {
              newFinals += result[0].transcript;
              lastProcessedFinalIndexRef.current = i;
            }
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (newFinals) {
          const base = stableTextRef.current.trim();
          const separator = base && !base.endsWith(" ") ? " " : "";
          stableTextRef.current = base + separator + newFinals.trim();
        }

        const base = stableTextRef.current.trim();
        const separator = base && !base.endsWith(" ") ? " " : "";
        const visibleText = base + (currentInterim ? separator + currentInterim.trim() : "");
        setPromptText(visibleText);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setIsPermissionDenied(true);
          toast.error("Microphone permission denied. Please allow microphone access.");
          stopListening();
        } else if (event.error === "no-speech") {
          // ignore no speech
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
          stopListening();
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      toast.error("Failed to start speech recognition.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const onTextChange = (e) => {
    const newValue = e.target.value;
    setPromptText(newValue);
    stableTextRef.current = newValue;
    if (isListening) {
      lastProcessedFinalIndexRef.current = currentResultsLengthRef.current - 1;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent inserting a newline
      handlePrompt();
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (file.type.startsWith("image/")) {
          setSelectedImage(event.target.result);
        } else if (file.type.startsWith("audio/")) {
          setSelectedAudio(event.target.result);
        } else {
          toast.error("Unsupported file type. Please select an image or audio file.");
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // CSS Grid Area configurations for layout transitions
  const containerStyle = isMultiLine
    ? {
        display: "grid",
        gridTemplateAreas: `
          "textarea textarea"
          "divider divider"
          "left-icons right-icons"
        `,
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "auto auto auto",
      }
    : {
        display: "grid",
        gridTemplateAreas: `
          "left-icons textarea right-icons"
        `,
        gridTemplateColumns: "auto 1fr auto",
        gridTemplateRows: "auto",
        alignItems: "center",
      };

  return (
    <div className="relative w-full rounded-xl bg-[#fafafa] dark:bg-[#0d0d0d] text-primary shadow-lg border border-default dark:border-zinc-700 transition-all duration-200">
      {/* Hidden File Input */}
      <input
        type="file"
        id="file-upload"
        accept="image/*,audio/*"
        className="hidden"
        onChange={onFileChange}
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

      {/* Input Grid Area Container */}
      <div
        style={containerStyle}
        className="w-full p-2 gap-x-2 gap-y-1.5 transition-all duration-200 select-none"
      >
        {/* Left Icons (Attach Files) */}
        <div
          style={{ gridArea: "left-icons" }}
          className={`flex items-center justify-start h-[34px] ${isMultiLine ? "self-end" : "self-center"}`}
        >
          <div
            onClick={() => document.getElementById("file-upload").click()}
            className="hover:bg-hover-bg p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center w-[34px] h-[34px]"
            title="Attach Files (Image or Audio)"
          >
            <img
              src="https://img.icons8.com/?size=100&id=354k6pS0PoMI&format=png&color=1A1A1A"
              alt="Attach Files"
              className="w-[18px] h-auto dark:invert invert-0"
            />
          </div>
        </div>

        {/* Text Area Input */}
        <textarea
          ref={inputBarRef}
          placeholder="Ask Anything..."
          value={promptText}
          onChange={onTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ gridArea: "textarea" }}
          className="w-full resize-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm leading-relaxed text-black dark:text-white placeholder:text-secondary overflow-x-hidden overflow-y-hidden py-1.5 px-2 font-sans self-center"
        />

        {/* Horizontal Divider Line */}
        {isMultiLine && (
          <div
            style={{ gridArea: "divider" }}
            className="border-t border-default dark:border-zinc-800 w-full"
          />
        )}

        {/* Right Icons (Microphone Dictation & Send Button) */}
        <div
          style={{ gridArea: "right-icons" }}
          className={`flex items-center gap-1 sm:gap-1.5 justify-end h-[34px] ${isMultiLine ? "self-end" : "self-center"}`}
        >
          {/* Live Dictation (Microphone) */}
          {!isSupported ? (
            <button
              type="button"
              disabled
              className="p-2 rounded-lg opacity-40 cursor-not-allowed text-secondary flex items-center justify-center border-none bg-transparent outline-none w-[34px] h-[34px]"
              title="Live speech recognition is not supported in this browser"
            >
              <MicOff className="w-[18px] h-[18px]" />
            </button>
          ) : isPermissionDenied ? (
            <button
              type="button"
              onClick={() => toast.error("Microphone permission was denied. Please enable it in browser settings.")}
              className="p-2 rounded-lg text-red-500/60 hover:text-red-500 cursor-pointer flex items-center justify-center border-none bg-transparent outline-none w-[34px] h-[34px]"
              title="Microphone permission denied"
            >
              <MicOff className="w-[18px] h-[18px]" />
            </button>
          ) : isListening ? (
            <button
              type="button"
              onClick={toggleListening}
              className="bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg cursor-pointer transition-colors text-red-500 flex items-center justify-center border-none outline-none animate-pulse w-[34px] h-[34px]"
              title="Stop voice dictation"
            >
              <Mic className="w-[18px] h-[18px] text-red-500" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleListening}
              className="hover:bg-hover-bg p-2 rounded-lg cursor-pointer transition-colors text-primary flex items-center justify-center border-none bg-transparent outline-none w-[34px] h-[34px]"
              title="Start voice dictation"
            >
              <Mic className="w-[18px] h-[18px] text-zinc-700 dark:text-zinc-300" />
            </button>
          )}

          {/* Send Button */}
          <div
            onClick={handlePrompt}
            className="bg-accent hover:bg-accent-hover p-2 rounded-lg cursor-pointer shadow-md transition-colors w-[34px] h-[34px] flex items-center justify-center"
            title="Send"
          >
            <img
              src="https://img.icons8.com/?size=100&id=7789&format=png&color=ffffff"
              alt="Send Prompt"
              className="w-[16px] h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
