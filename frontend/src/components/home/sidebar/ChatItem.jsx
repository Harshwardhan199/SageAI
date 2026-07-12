// components/home/sidebar/ChatItem.jsx

import { useState, useRef, useEffect } from "react";

const ChatItem = ({
  chat,
  folders,
  currentFolder,

  chatMenuId,

  toggleChatMenu,

  OpenChat,

  handleChatDelete,
  handleMoveChat,
  handleChatRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const inputRef = useRef(null);
  const isSaving = useRef(false);
  const didCancel = useRef(false);

  useEffect(() => {
    setEditTitle(chat.title);
  }, [chat.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    didCancel.current = false;
    setEditTitle(chat.title);
    setIsEditing(true);
    toggleChatMenu(null);
  };

  const saveRename = async () => {
    if (isSaving.current || didCancel.current) return;
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== chat.title) {
      isSaving.current = true;
      await handleChatRename(chat._id, trimmed);
    } else {
      setEditTitle(chat.title);
    }
    setIsEditing(false);
    isSaving.current = false;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      didCancel.current = true;
      setIsEditing(false);
      setEditTitle(chat.title);
    }
  };

  const handleBlur = () => {
    if (!didCancel.current && !isSaving.current) {
      saveRename();
    }
  };

  return (
    <div
      className="flex flex-col item-center justify-between w-full rounded-lg bg-[#272727] gap-1 overflow-visible group/chat"
      onClick={() => {
        if (!isEditing) {
          OpenChat(chat._id);
        }
      }}
      onMouseLeave={() => {
        if (chatMenuId === chat._id) {
          toggleChatMenu(null);
        }
      }}
    >
      <div className="flex justify-between gap-2 overflow-visible">
        <div className="flex flex-1 items-center gap-2 p-2 overflow-hidden">
          <div className="flex items-center w-full">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onClick={(e) => e.stopPropagation()}
                className="w-full outline-none"
              />
            ) : (
              <span className="truncate flex-1">{chat.title}</span>
            )}
          </div>
        </div>

        {/* Options */}
        <div
          className="relative flex items-center overflow-visible opacity-0 group-hover/chat:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            toggleChatMenu(chat._id);
          }}
        >
          <img
            src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd"
            alt="Options"
            className="options-button w-[14px] h-auto mx-2"
          />

          {chatMenuId === chat._id && (
            <div
              className="menu-container absolute -left-[15px] top-full flex flex-col gap-1 min-w-23 p-1 bg-[#272727] border border-[#393939] drop-shadow rounded-lg z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Rename */}
              <div
                className="px-3 py-1 rounded-lg hover:bg-[#323232] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
              >
                Rename
              </div>

              <div className="h-[1px] w-full bg-[#393939]" />

              {/* Move */}
              <div className="relative group">
                <div className="px-4 py-1 rounded-lg hover:bg-[#323232] flex justify-between items-center cursor-pointer gap-2">
                  <div>Move to</div>

                  <img
                    src="https://img.icons8.com/?size=100&id=61&format=png&color=ffffff"
                    alt="Move"
                    className="h-[14px]"
                  />
                </div>

                <div
                  className={`absolute left-[97%] top-0 ml-1 hidden group-hover:flex flex-col gap-1 min-w-28 p-1 bg-[#272727] border border-[#393939] drop-shadow rounded-lg z-20"`}
                >
                  {folders
                    .filter((folder) =>
                      currentFolder ? folder._id !== currentFolder._id : true,
                    )
                    .map((folder) => (
                      <div
                        key={folder._id}
                        className="px-3 py-1 rounded-lg hover:bg-[#323232]"
                        onClick={() => handleMoveChat(chat._id, folder._id)}
                      >
                        {folder.name}
                      </div>
                    ))}

                  {/* Only show Ungroup when inside a folder */}
                  {currentFolder && (
                    <>
                      <div className="h-[1px] w-full bg-[#393939]" />

                      <div
                        className="px-3 py-1 rounded-lg hover:bg-[#323232]"
                        onClick={() => handleMoveChat(chat._id, null)}
                      >
                        Ungroup
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="h-[1px] w-full bg-[#393939]" />

              {/* Delete */}
              <div
                className="px-3 py-1 rounded-lg hover:bg-[#323232] text-red-600"
                onClick={() => handleChatDelete(chat._id)}
              >
                Delete
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;
