// components/home/sidebar/FolderItem.jsx

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
        <div className="flex item-center justify-between ml-[5px] rounded-r-lg bg-[#1f1f1f] overflow-visible">
          <div className="flex gap-2 p-2">
            <div className="flex items-center">
              <img
                src={
                  isOpen
                    ? "https://img.icons8.com/?size=100&id=82790&format=png&color=ffffff"
                    : "https://img.icons8.com/?size=100&id=82843&format=png&color=cccccc"
                }
                alt="Folder"
                className="w-[20px] h-auto flex-shrink-0"
              />
            </div>

            <div>{folder.name}</div>
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
              className="options-button w-[14px] h-auto flex-shrink-0 mx-2"
            />

            {folderMenuId === folder._id && (
              <div
                className="menu-container absolute -left-[15px] top-full flex flex-col gap-1 p-1 bg-[#272727] border border-[#393939] drop-shadow rounded-lg z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="px-3 py-1 rounded-lg hover:bg-[#323232]"
                  onClick={() => handleFolderCustomize(folder)}
                >
                  Edit
                </div>

                <div className="h-[1px] w-full bg-[#393939]" />

                <div
                  className="px-3 py-1 rounded-lg hover:bg-[#323232] text-red-600"
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
          />
        ))}
      </div>
    </div>
  );
};

export default FolderItem;
