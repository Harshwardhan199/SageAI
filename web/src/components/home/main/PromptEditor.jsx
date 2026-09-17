import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Plus } from "lucide-react";
import { toast } from "react-toastify";

const PromptEditor = ({
  value = "",
  onChange,
  onSend,
  onCancel,
  placeholder = "Ask Anything...",
  autoFocus = false,
  selectedImage,
  setSelectedImage,
  selectedAudio,
  setSelectedAudio,
  onImagePreview,
  showAttach = false,
  showMic = true,
  sendLabel = null,
  inputRef,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const localInputRef = useRef(null);
  const activeInputRef = inputRef || localInputRef;
  const singleLineHeightRef = useRef(36);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  const recognitionRef = useRef(null);
  const stableTextRef = useRef(value);
  const currentResultsLengthRef = useRef(0);
  const lastProcessedFinalIndexRef = useRef(-1);

  // Auto-focus on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && activeInputRef.current) {
      activeInputRef.current.focus();
      const len = activeInputRef.current.value.length;
      activeInputRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus, activeInputRef]);

  // Auto-resize the textarea height based on content
  const adjustHeight = () => {
    const textarea = activeInputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;

    if (textarea.value === "" && scrollHeight > 0) {
      singleLineHeightRef.current = scrollHeight;
    }

    const minHeight = singleLineHeightRef.current;
    const maxHeight = 200;

    const hasNewline = textarea.value.includes("\n");
    const isMulti = hasNewline || scrollHeight > singleLineHeightRef.current + 6;
    setIsMultiLine(isMulti);

    const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${targetHeight}px`;

    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    window.addEventListener("resize", adjustHeight);
    return () => {
      window.removeEventListener("resize", adjustHeight);
    };
  }, []);

  useEffect(() => {
    if (value === "") {
      stableTextRef.current = "";
      lastProcessedFinalIndexRef.current = -1;
      currentResultsLengthRef.current = 0;
    }
  }, [value]);

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
    setIsListening(true);
    setIsPermissionDenied(false);

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        stableTextRef.current = value;
        currentResultsLengthRef.current = 0;
        lastProcessedFinalIndexRef.current = -1;
      };

      rec.onresult = (event) => {
        let currentInterim = "";
        let newFinals = "";

        currentResultsLengthRef.current = event.results.length;

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
        onChange && onChange(visibleText);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setIsPermissionDenied(true);
          toast.error("Microphone permission denied. Please allow microphone access.");
          stopListening();
        } else if (event.error === "no-speech") {
          // ignore
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
    onChange && onChange(newValue);
    stableTextRef.current = newValue;
    if (isListening) {
      lastProcessedFinalIndexRef.current = currentResultsLengthRef.current - 1;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && onSend) {
        onSend();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (value.trim() && onSend) {
        onSend();
      }
    } else if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (file.type.startsWith("image/")) {
          setSelectedImage && setSelectedImage(event.target.result);
        } else if (file.type.startsWith("audio/")) {
          setSelectedAudio && setSelectedAudio(event.target.result);
        } else {
          toast.error("Unsupported file type. Please select an image or audio file.");
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const containerStyle = showAttach
    ? isMultiLine
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
      }
    : isMultiLine
      ? {
        display: "grid",
        gridTemplateAreas: `
          "textarea textarea"
          "divider divider"
          "empty-space right-icons"
        `,
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "auto auto auto",
      }
      : {
        display: "grid",
        gridTemplateAreas: `
          "textarea right-icons"
        `,
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "auto",
        alignItems: "center",
      };

  return (
    <div className="relative w-full rounded-xl bg-card-bg text-primary shadow-lg border border-default transition-all duration-200">
      {/* Hidden File Input if showAttach */}
      {showAttach && (
        <input
          type="file"
          id="file-upload"
          accept="image/*,audio/*"
          className="hidden"
          onChange={onFileChange}
        />
      )}

      {/* File Previews if attachments present */}
      {(selectedImage || selectedAudio) && (
        <div className="flex flex-wrap gap-2 p-2 bg-hover-bg/30 border-b border-default rounded-t-xl select-none">
          {selectedImage && (
            <div className="relative w-14 h-14 border border-default rounded-lg overflow-hidden group bg-hover-bg shadow-sm flex-shrink-0">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition-all"
                onClick={() => onImagePreview && onImagePreview(selectedImage)}
              />
              <button
                type="button"
                onClick={() => setSelectedImage && setSelectedImage(null)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-black cursor-pointer font-bold transition-all"
              >
                ×
              </button>
            </div>
          )}
          {selectedAudio && (
            <div className="relative flex items-center gap-2 p-1.5 px-2.5 border border-default rounded-lg bg-hover-bg shadow-sm text-xs max-w-xs flex-shrink-0">
              <span className="text-[11px] text-primary font-medium truncate max-w-[120px]">
                🎵 Audio Attached
              </span>
              <button
                type="button"
                onClick={() => setSelectedAudio && setSelectedAudio(null)}
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
        {showAttach && (
          <div
            style={{ gridArea: "left-icons" }}
            className={`flex items-center justify-start h-[34px] ${isMultiLine ? "self-end" : "self-center"}`}
          >
            <div
              onClick={() => document.getElementById("file-upload").click()}
              className="hover:bg-hover-bg p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center w-[34px] h-[34px] group"
              title="Attach Files (Image or Audio)"
            >
              <Plus className="w-[18px] h-[18px] text-secondary group-hover:text-primary transition-colors" />
            </div>
          </div>
        )}

        {/* Text Area Input */}
        <textarea
          ref={activeInputRef}
          placeholder={placeholder}
          value={value}
          onChange={onTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ gridArea: "textarea" }}
          className="w-full resize-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm leading-relaxed text-primary placeholder:text-secondary overflow-x-hidden py-1.5 px-2 font-sans self-center custom-scrollbar"
        />

        {/* Horizontal Divider Line */}
        {isMultiLine && (
          <div
            style={{ gridArea: "divider" }}
            className="border-t border-default dark:border-zinc-800 w-full"
          />
        )}

        {/* Right Icons (Voice Dictation, Cancel & Send Buttons) */}
        <div
          style={{ gridArea: "right-icons" }}
          className={`flex items-center gap-1 sm:gap-1.5 justify-end h-[34px] ${isMultiLine ? "self-end" : "self-center"}`}
        >
          {/* Live Dictation (Microphone) */}
          {showMic && (
            !isSupported ? (
              <button
                type="button"
                disabled
                className="p-2 rounded-lg opacity-40 cursor-not-allowed text-zinc-400 dark:text-zinc-600 flex items-center justify-center border-none bg-transparent outline-none w-[34px] h-[34px]"
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
                className="hover:bg-hover-bg p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center border-none bg-transparent outline-none w-[34px] h-[34px] group"
                title="Start voice dictation"
              >
                <Mic className="w-[18px] h-[18px] text-secondary group-hover:text-primary transition-colors" />
              </button>
            )
          )}

          {/* Cancel Button (if editing) */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg border border-default bg-hover-bg hover:bg-default/50 text-secondary hover:text-primary text-xs font-semibold cursor-pointer transition-colors h-[34px] flex items-center justify-center"
            >
              Cancel
            </button>
          )}

          {/* Send Button */}
          <button
            type="button"
            onClick={onSend}
            disabled={!value || value.trim() === ""}
            className={`rounded-lg shadow-md transition-colors flex items-center justify-center border-none outline-none ${sendLabel ? "px-3 py-1.5 text-xs font-semibold text-white h-[34px]" : "p-2 w-[34px] h-[34px]"
              } bg-accent hover:bg-accent-hover cursor-pointer`}
            title={sendLabel || "Send"}
          >
            {sendLabel ? (
              <span>{sendLabel}</span>
            ) : (
              <img
                src="https://img.icons8.com/?size=100&id=7789&format=png&color=ffffff"
                alt="Send Prompt"
                className="w-[16px] h-auto"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
