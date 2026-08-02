import { useState, useRef, useEffect } from "react";

const ChatItem = ({
  chat,
  projects = [],
  currentProject,
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
      className="flex flex-col item-center justify-between w-full rounded-lg bg-card-bg border border-default text-primary gap-1 overflow-visible group/chat hover:bg-hover-bg transition-colors duration-200 cursor-pointer"
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
                className="w-full outline-none bg-transparent text-primary text-sm font-medium"
              />
            ) : (
              <span className="truncate flex-1 text-sm font-medium">
                {chat.title}
              </span>
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
            className="options-button w-[14px] h-auto mx-2 theme-icon-light"
          />

          {chatMenuId === chat._id && (
            <div
              className="menu-container absolute left-[0%] top-[80%] flex flex-col gap-1 min-w-36 p-1 bg-card-bg border border-default drop-shadow rounded-lg z-20 text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Rename */}
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-hover-bg cursor-pointer font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
              >
                <img
                  src="https://img.icons8.com/?size=100&id=jCmEz2kpksC4&format=png&color=ffffff"
                  alt="Edit"
                  className="w-3.5 h-3.5 theme-icon-light flex-shrink-0"
                />
                <span>Rename</span>
              </div>

              <div className="h-[1px] w-full bg-default/80 dark:bg-zinc-700/80" />

              {/* 2. Remove from {current project name} (Only if inside a user project) */}
              {currentProject && (
                <>
                  <div
                    className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg hover:bg-hover-bg cursor-pointer font-medium text-primary max-w-[200px]"
                    title={`Remove from ${currentProject.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChatMenu(null);
                      handleMoveChat(chat._id, null);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M21 11V7.5A1.5 1.5 0 0 0 19.5 6H11l-2-2H4.5A1.5 1.5 0 0 0 3 5.5V18.5A1.5 1.5 0 0 0 4.5 20H13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 15L22 20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M22 15L17 20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="truncate">Remove from {currentProject.name}</span>
                  </div>

                  <div className="h-[1px] w-full bg-default/80 dark:bg-zinc-700/80" />
                </>
              )}

              {/* 3. Move to project > */}
              <div className="relative group">
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-hover-bg cursor-pointer font-medium">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M21 11V7.5A1.5 1.5 0 0 0 19.5 6H11l-2-2H4.5A1.5 1.5 0 0 0 3 5.5V18.5A1.5 1.5 0 0 0 4.5 20H12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14.5 17h5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M19 14.5L21.5 17L19 19.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Move to project</span>
                  </div>

                  <img
                    src="https://img.icons8.com/?size=100&id=61&format=png&color=ffffff"
                    alt="Arrow"
                    className="h-[12px] theme-icon-light flex-shrink-0"
                  />
                </div>

                <div className="absolute left-[98%] -top-[10%] ml-1 hidden group-hover:flex flex-col gap-1 min-w-36 p-1 bg-card-bg border border-default drop-shadow rounded-lg z-20">
                  {(() => {
                    const filteredProjects = (projects || []).filter((project) =>
                      currentProject ? project._id !== currentProject._id : true
                    );

                    if (filteredProjects.length === 0) {
                      return (
                        <div className="px-3 py-1.5 text-xs text-secondary italic">
                          No other projects
                        </div>
                      );
                    }

                    return filteredProjects.map((project, idx) => (
                      <div key={project._id}>
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg hover:bg-hover-bg font-medium cursor-pointer text-primary transition-colors duration-150"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChatMenu(null);
                            handleMoveChat(chat._id, project._id);
                          }}
                        >
                          <img
                            src="https://img.icons8.com/?size=100&id=82843&format=png&color=cccccc"
                            alt="Project"
                            className="w-3.5 h-auto flex-shrink-0 theme-icon-light"
                          />
                          <span className="truncate">{project.name}</span>
                        </div>
                        {idx < filteredProjects.length - 1 && (
                          <div className="h-[1px] w-full bg-default/80 dark:bg-zinc-700/80 my-0.5" />
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="h-[1px] w-full bg-default/80 dark:bg-zinc-700/80" />

              {/* 4. Delete */}
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-hover-bg text-red-600 font-semibold cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChatDelete(chat._id);
                }}
              >
                <img
                  src="https://img.icons8.com/?size=100&id=14237&format=png&color=ffffff"
                  alt="Delete"
                  className="w-3.5 h-3.5 theme-icon-light flex-shrink-0"
                />
                <span>Delete</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;
