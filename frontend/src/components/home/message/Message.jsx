import React, { forwardRef } from "react";

import { useAuth } from "../../../context/AuthContext";
import { savePrompt } from "../../../services/promptService";

import UserMessageActions from "./UserMessageActions";
import MessageBody from "./MessageBody";

const Message = forwardRef(({ sender, text, style, loadSavedPrompts }, ref) => {
  const { user } = useAuth();

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
      className={`w-full flex gap-1 ${isUser ? "flex-col justify-end group" : "justify-start"}`}
    >
      <div
        className={`py-2 rounded-2xl shadow ${isUser ? "self-end max-w-full px-4 bg-[#1f1f1f] text-white group" : "w-full text-white"}`}
        style={style}
      >
        <MessageBody text={text} isUser={isUser} />
      </div>

      {isUser && (
        <UserMessageActions user={user} text={text} onSave={handleSavePrompt} />
      )}
    </div>
  );
});

export default Message;
