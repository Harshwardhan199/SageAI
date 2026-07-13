import React, { forwardRef } from "react";

import { useAuth } from "../../../context/AuthContext";
import { savePrompt } from "../../../services/promptService";
import useTheme from "../../../hooks/useTheme";

import UserMessageActions from "./UserMessageActions";
import BotMessageActions from "./BotMessageActions";
import MessageBody from "./MessageBody";

const Message = forwardRef(({ message, style, loadSavedPrompts }, ref) => {
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

  return (
    <div
      ref={ref}
      className={`w-full flex gap-1 ${isUser ? "flex-col justify-end group" : "flex-col justify-start group"}`}
    >
      <div
        className={`rounded-2xl transition-all duration-200 ${
          isUser
            ? "self-end max-w-full bg-accent text-white group py-2 px-4 shadow-sm"
            : "w-full bg-transparent border-none shadow-none text-primary py-2 px-0"
        }`}
        style={style}
      >
        <MessageBody message={message} isUser={isUser} />
        {showTimestamps && (
          <div className={`text-[9px] mt-1 select-none ${isUser ? "text-white/70 text-right" : "text-secondary text-left"}`}>
            {formattedTime}
          </div>
        )}
      </div>

      {isUser ? (
        <UserMessageActions user={user} text={userText} onSave={handleSavePrompt} />
      ) : (
        <BotMessageActions message={message} />
      )}
    </div>
  );
});


export default Message;
