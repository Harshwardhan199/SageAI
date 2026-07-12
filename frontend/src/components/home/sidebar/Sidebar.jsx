// components/home/sidebar/Sidebar.jsx

import SidebarHeader from "./SidebarHeader";
import FolderSection from "./FolderSection";
import ChatSection from "./ChatSection";
import UserSection from "./UserSection";

const Sidebar = ({
  // User
  user,
  username,

  // Sidebar
  toggleSidebar,
  sidebarHover,

  refSidebar,
  refLogo,
  refFoldersExpandBtn,
  refChatsExpandBtn,

  // Folder
  folders,
  showFolders,
  foldersWindowHeight,
  openFolders,
  folderMenuId,

  // Chats
  chats,
  showChats,
  chatsWindowHeight,
  chatMenuId,

  // Profile
  showProfileMenu,

  // Actions
  LeftSideToggle,
  RightSideToggle,
  handleMouseEnter,
  handleMouseLeave,

  handleNewChat,

  ToggleFolderList,
  OpenFolder,
  toggleFolderMenu,
  handleFolderDelete,
  CreateFolderPopup,

  ToggleChatList,
  OpenChat,
  toggleChatMenu,
  handleChatDelete,
  handleMoveChat,

  setShowProfileMenu,
  handleLogOut,
}) => {
  return (
    <div className="fixed flex top-0 left-0 border-r border-r-[#151515] overflow-visible z-30">
      <div
        ref={refSidebar}
        onMouseEnter={user ? handleMouseEnter : undefined}
        onMouseLeave={handleMouseLeave}
        className={`flex flex-col h-screen items-center py-1 gap-3 bg-[#070707]
        ${
          !toggleSidebar ? "w-[58px]" : "w-[301px]"
        } text-white overflow-visible whitespace-nowrap transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full w-full rounded-xl bg-[#070707] p-2 gap-1 overflow-visible">
          {/* Logo + Collapse */}
          <SidebarHeader
            user={user}
            toggleSidebar={toggleSidebar}
            sidebarHover={sidebarHover}
            refLogo={refLogo}
            LeftSideToggle={LeftSideToggle}
            RightSideToggle={RightSideToggle}
          />

          {/* New Chat */}
          <div className="flex w-full mb-1">
            <div
              onClick={handleNewChat}
              className="flex item-center gap-2 h-[40px] w-full rounded-lg bg-[#155dfc] p-2 text-white overflow-hidden whitespace-nowrap cursor-pointer"
            >
              <div className="flex items-center flex-shrink-0">
                <img
                  src="https://img.icons8.com/?size=100&id=zqRKVWtC1VeY&format=png&color=ffffff"
                  alt="New Chat"
                  className="rounded-full w-[24px] h-auto"
                />
              </div>

              <div
                className={`transition-all duration-200 ease-in-out ${
                  !toggleSidebar ? "opacity-0" : "opacity-100"
                }`}
              >
                New Chat
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div
            className={`transition-all duration-200 ease-in-out overflow-visible whitespace-nowrap ${
              !toggleSidebar ? "opacity-0" : "opacity-100"
            }`}
          >
            <FolderSection
              folders={folders}
              openFolders={openFolders}
              showFolders={showFolders}
              foldersWindowHeight={foldersWindowHeight}
              folderMenuId={folderMenuId}
              chatMenuId={chatMenuId}
              refFoldersExpandBtn={refFoldersExpandBtn}
              ToggleFolderList={ToggleFolderList}
              OpenFolder={OpenFolder}
              toggleFolderMenu={toggleFolderMenu}
              toggleChatMenu={toggleChatMenu}
              handleFolderDelete={handleFolderDelete}
              handleChatDelete={handleChatDelete}
              handleMoveChat={handleMoveChat}
              OpenChat={OpenChat}
              CreateFolderPopup={CreateFolderPopup}
            />

            <ChatSection
              chats={chats}
              folders={folders}
              showFolders={showFolders}
              showChats={showChats}
              chatsWindowHeight={chatsWindowHeight}
              chatMenuId={chatMenuId}
              refChatsExpandBtn={refChatsExpandBtn}
              ToggleChatList={ToggleChatList}
              toggleChatMenu={toggleChatMenu}
              OpenChat={OpenChat}
              handleChatDelete={handleChatDelete}
              handleMoveChat={handleMoveChat}
            />
          </div>

          {/* Bottom User Section */}
          <UserSection
            user={user}
            username={username}
            toggleSidebar={toggleSidebar}
            showProfileMenu={showProfileMenu}
            setShowProfileMenu={setShowProfileMenu}
            handleLogOut={handleLogOut}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
