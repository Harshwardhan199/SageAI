import { useState } from "react";

const UserMessageActions = ({ user, text, onSave }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const handleSave = async () => {
    await onSave(text);

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-250">
      {/* Copy */}
      <div
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1f1f1f] cursor-pointer"
        onClick={handleCopy}
      >
        <img
          src={
            copied
              ? "https://img.icons8.com/?size=100&id=98955&format=png&color=ffffff"
              : "https://img.icons8.com/?size=100&id=pNYOTp5DinZ3&format=png&color=ffffff"
          }
          alt="Copy"
          className="w-4 h-4"
        />
      </div>

      {/* Save */}
      {user && (
        <div
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1f1f1f] cursor-pointer"
          onClick={handleSave}
        >
          <img
            src={
              saved
                ? "https://img.icons8.com/?size=100&id=98955&format=png&color=ffffff"
                : "https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=ffffff"
            }
            alt="Save"
            className="w-4 h-4"
          />
        </div>
      )}
    </div>
  );
};

export default UserMessageActions;
