import React, { forwardRef } from "react";

import { useAuth } from "../../../context/AuthContext";
import { savePrompt } from "../../../services/promptService";
import useTheme from "../../../hooks/useTheme";

import UserMessageActions from "./UserMessageActions";
import BotMessageActions from "./BotMessageActions";
import MessageBody from "./MessageBody";
import UserImageAttachment from "../../common/UserImageAttachment";

const Message = forwardRef(({ message, style, loadSavedPrompts, onImagePreview }, ref) => {
  const { user } = useAuth();
  const { theme, showTimestamps } = useTheme();
  const { sender, blocks } = message;

  const isUser = sender === "user";
  const userText = blocks && blocks.length > 0 ? blocks[0].content : "";

  // Format timestamp
  const formattedTime = new Date(message.createdAt || message._id || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  //Save Prompt
  const handleSavePrompt = async (text) => {
    try {
      await savePrompt(text);
      loadSavedPrompts();
    } catch (error) {
      console.error("Error Saving Prompt:", error);
    }
  };

  const rawText = blocks && blocks.length > 0 ? blocks[0].content : "";
  const cleanedText = typeof rawText === "string"
    ? rawText
        .replace(/[🖼️\s]*\[Image Attached\]/g, "")
        .replace(/[🎵\s]*\[Audio Attached\]/g, "")
        .trim()
    : "";

  const imagePart = message.parts && message.parts.find(p => p.type === "image");
  const audioPart = message.parts && message.parts.find(p => p.type === "audio");

  return (
    <div
      ref={ref}
      className={`w-full flex gap-1 ${isUser ? "flex-col justify-end group" : "flex-col justify-start group"}`}
    >
      {isUser ? (
        <div className="flex flex-col gap-2 max-w-full">
          {/* Attachment Bubble */}
          {imagePart && (
            <div
              className="self-end w-fit bg-card-bg border border-default p-1.5 shadow-md rounded-xl cursor-pointer hover:brightness-95 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 flex items-center justify-center flex-shrink-0"
              onClick={() => onImagePreview && onImagePreview(imagePart.url)}
            >
              <UserImageAttachment
                src={imagePart.url}
                onClick={() => onImagePreview && onImagePreview(imagePart.url)}
              />
            </div>
          )}

          {/* Voice Badge */}
          {audioPart && (
            <div className="self-end flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg bg-accent text-white text-xs w-fit font-medium shadow-sm select-none border border-white/10 flex-shrink-0">
              <span>🎵 Voice Message</span>
            </div>
          )}

          {/* Text Bubble */}
          {cleanedText && (
            <div
              className="self-end max-w-full bg-accent text-white group py-2 px-4 shadow-sm rounded-2xl transition-all duration-200"
              style={style}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {cleanedText}
              </div>
              {showTimestamps && (
                <div className="text-[9px] mt-1 select-none text-white/70 text-right">
                  {formattedTime}
                </div>
              )}
            </div>
          )}

          {/* Timestamp if ONLY image was attached */}
          {!cleanedText && showTimestamps && (
            <div className="text-[9px] select-none text-secondary text-right pr-1">
              {formattedTime}
            </div>
          )}
        </div>
      ) : (
        <div
          className="w-full bg-transparent border-none shadow-none text-primary py-2 px-0 transition-all duration-200"
          style={style}
        >
          <MessageBody message={message} isUser={isUser} onImagePreview={onImagePreview} />
          {showTimestamps && (
            <div className={`text-[9px] mt-1 select-none text-secondary text-left`}>
              {formattedTime}
            </div>
          )}
        </div>
      )}

      {isUser ? (
        <UserMessageActions user={user} text={cleanedText || "Image Attachment"} onSave={handleSavePrompt} />
      ) : (
        <BotMessageActions message={message} />
      )}
    </div>
  );
});


export default Message;
