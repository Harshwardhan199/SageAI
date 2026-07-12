// components/home/sidebar/FolderSection.jsx

import FolderItem from "./FolderItem";

const FolderSection = ({
  folders,
  openFolders,
  showFolders,
  foldersWindowHeight,

  folderMenuId,
  chatMenuId,

  refFoldersExpandBtn,

  ToggleFolderList,
  OpenFolder,

  toggleFolderMenu,
  toggleChatMenu,

  handleFolderDelete,
  handleChatDelete,
  handleMoveChat,
  handleChatRename,

  OpenChat,

  CreateFolderPopup,
  handleFolderCustomize,
}) => {
  return (
    <>
      {/* Header */}
      <div className="flex item-center justify-between w-full rounded-xl bg-[#070707] py-2 text-sm mt-[10px]">
        <div>Folders</div>

        <div className="flex item-center justify-center gap-1">
          <button
            className="h-[20px] rounded-md bg-[#272727] px-1 flex-shrink-0"
            onClick={CreateFolderPopup}
          >
            <img
              src="https://img.icons8.com/?size=100&id=37784&format=png&color=000000"
              alt="Create Folder"
              className="invert w-[10px] h-auto"
            />
          </button>

          <button
            className="h-[20px] rounded-md bg-[#272727] px-1"
            onClick={ToggleFolderList}
          >
            <img
              src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A"
              alt="Expand"
              className="invert w-[10px] h-auto transition-all duration-300"
              ref={refFoldersExpandBtn}
            />
          </button>
        </div>
      </div>

      {/* Folder List */}
      <div
        className={`flex flex-col gap-1 w-full rounded-lg overflow-visible transition-all duration-300 ease-in-out ${
          showFolders ? "opacity-100" : "opacity-0"
        }`}
        style={{ height: foldersWindowHeight }}
      >
        {/* Empty State */}
        {folders.length === 0 && (
          <div className="flex w-full mb-1">
            <div
              className="flex item-center gap-2 h-[40px] w-full rounded-lg bg-[#1f1f1f] p-2 text-white overflow-hidden whitespace-nowrap cursor-pointer"
              onClick={CreateFolderPopup}
            >
              <div className="flex items-center flex-shrink-0">
                <img
                  src="https://img.icons8.com/?size=100&id=WDLQ4iMx1qkz&format=png&color=ffffff"
                  alt="Create Folder"
                  className="w-[24px] h-auto"
                />
              </div>

              <div>Create New Folder</div>
            </div>
          </div>
        )}

        {/* Folder Items */}
        {folders.map((folder) => (
          <FolderItem
            key={folder._id}
            folder={folder}
            folders={folders}
            isOpen={openFolders[folder._id]}
            folderMenuId={folderMenuId}
            chatMenuId={chatMenuId}
            OpenFolder={OpenFolder}
            toggleFolderMenu={toggleFolderMenu}
            toggleChatMenu={toggleChatMenu}
            handleFolderDelete={handleFolderDelete}
            handleChatDelete={handleChatDelete}
            handleMoveChat={handleMoveChat}
            handleChatRename={handleChatRename}
            OpenChat={OpenChat}
            handleFolderCustomize={handleFolderCustomize}
          />
        ))}
      </div>
    </>
  );
};

export default FolderSection;
