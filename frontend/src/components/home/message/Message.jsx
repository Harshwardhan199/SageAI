import React, { forwardRef } from "react";

import { useAuth } from "../../../context/AuthContext";
import { savePrompt } from "../../../services/promptService";

import UserMessageActions from "./UserMessageActions";
import BotMessageActions from "./BotMessageActions";
import MessageBody from "./MessageBody";

const Message = forwardRef(({ message, style, loadSavedPrompts }, ref) => {
  const { user } = useAuth();
  const { sender, content } = message;

  const isUser = sender === "user";

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
        className={`py-2 rounded-2xl shadow ${isUser ? "self-end max-w-full px-4 bg-[#1f1f1f] text-white group" : "w-full text-white"}`}
        style={style}
      >
        <MessageBody message={message} isUser={isUser} />
      </div>

      {isUser ? (
        <UserMessageActions user={user} text={content} onSave={handleSavePrompt} />
      ) : (
        <BotMessageActions message={message} />
      )}
    </div>
  );
});

export default Message;
