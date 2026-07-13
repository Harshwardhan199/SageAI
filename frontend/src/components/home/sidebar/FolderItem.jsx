import ChatItem from "./ChatItem";

const FolderItem = ({
  folder,
  folders,
  isOpen,

  folderMenuId,
  chatMenuId,

  OpenFolder,

  toggleFolderMenu,
  toggleChatMenu,

  handleFolderDelete,
  handleChatDelete,
  handleMoveChat,
  handleChatRename,

  OpenChat,
  handleFolderCustomize,
}) => {
  const chatsCount = folder.chats.length;

  const folderChatsWindowHeight = isOpen
    ? `${chatsCount * 40 + chatsCount * 4}px`
    : "0px";

  return (
    <div>
      {/* Folder Title */}
      <div
        className={`${folder.color} rounded-lg overflow-visible group`}
        onClick={() => OpenFolder(folder._id)}
        onMouseLeave={() => {
          if (folderMenuId === folder._id) {
            toggleFolderMenu(null);
          }
        }}
      >
        <div className="flex items-center justify-between ml-[5px] rounded-r-lg bg-card-bg border border-default border-l-0 text-primary hover:bg-hover-bg transition-all duration-200 overflow-visible cursor-pointer">
          <div className="flex gap-2 p-2.5">
            <div className="flex items-center">
              <img
                src={
                  isOpen
                    ? "https://img.icons8.com/?size=100&id=82790&format=png&color=ffffff"
                    : "https://img.icons8.com/?size=100&id=82843&format=png&color=cccccc"
                }
                alt="Folder"
                className="w-[20px] h-auto flex-shrink-0 theme-icon-light"
              />
            </div>

            <div className="text-sm font-semibold">{folder.name}</div>
          </div>

          {/* Folder Menu */}
          <div
            className="relative flex items-center overflow-visible opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              toggleFolderMenu(folder._id);
            }}
          >
            <img
              src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd"
              alt="Options"
              className="options-button w-[14px] h-auto flex-shrink-0 mx-2 dark:invert-0 invert"
            />

            {folderMenuId === folder._id && (
              <div
                className="menu-container absolute -left-[15px] top-full flex flex-col gap-1 p-1 bg-card-bg border border-default drop-shadow rounded-lg z-10 text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="px-3 py-1 text-xs rounded-lg hover:bg-hover-bg font-medium"
                  onClick={() => handleFolderCustomize(folder)}
                >
                  Edit
                </div>

                <div className="h-[1px] w-full bg-default/80 dark:bg-zinc-700/80" />

                <div
                  className="px-3 py-1 text-xs rounded-lg hover:bg-hover-bg text-red-600 font-semibold"
                  onClick={() => handleFolderDelete(folder._id)}
                >
                  Delete
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chats inside Folder */}
      <div
        className={`flex flex-col item-center w-full gap-1 pl-3 mt-1 transition-all duration-200 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 overflow-hidden"
        }`}
        style={{
          height: folderChatsWindowHeight,
        }}
      >
        {folder.chats.map((chat) => (
          <ChatItem
            key={chat._id}
            chat={chat}
            folders={folders}
            currentFolder={folder}
            chatMenuId={chatMenuId}
            toggleChatMenu={toggleChatMenu}
            OpenChat={OpenChat}
            handleChatDelete={handleChatDelete}
            handleMoveChat={handleMoveChat}
            handleChatRename={handleChatRename}
          />
        ))}
      </div>
    </div>
  );
};

export default FolderItem;
