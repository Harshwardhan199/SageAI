import SidebarHeader from "./SidebarHeader";
import ProjectSection from "./ProjectSection";
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
  refProjectsExpandBtn,
  refChatsExpandBtn,

  // Projects
  projects,
  showProjects,
  projectsWindowHeight,
  openProjects,
  projectMenuId,

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

  ToggleProjectList,
  OpenProject,
  toggleProjectMenu,
  handleProjectDelete,
  CreateProjectPopup,
  handleProjectCustomize,

  ToggleChatList,
  OpenChat,
  toggleChatMenu,
  handleChatDelete,
  handleMoveChat,
  handleChatRename,

  setShowProfileMenu,
  handleLogOut,
  onOpenSettings,
}) => {
  return (
    <div
      className={`fixed flex top-0 left-0 overflow-visible z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        toggleSidebar ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div
        ref={refSidebar}
        onMouseEnter={user ? handleMouseEnter : undefined}
        onMouseLeave={handleMouseLeave}
        className={`flex flex-col h-screen items-center py-1 gap-3 bg-sidebar-bg border-r border-default
        ${
          !toggleSidebar ? "w-[301px] md:w-[58px]" : "w-[301px]"
        } text-primary overflow-visible whitespace-nowrap transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full w-full rounded-xl bg-sidebar-bg p-2 gap-1 overflow-visible">
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
              className="flex items-center gap-2 h-[40px] w-full rounded-lg bg-accent hover:bg-accent-hover p-2 text-white overflow-hidden whitespace-nowrap cursor-pointer transition-colors shadow-sm"
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
                  !toggleSidebar
                    ? "opacity-0 md:hidden lg:block"
                    : "opacity-100"
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
            <ProjectSection
              projects={projects}
              openProjects={openProjects}
              showProjects={showProjects}
              projectsWindowHeight={projectsWindowHeight}
              projectMenuId={projectMenuId}
              chatMenuId={chatMenuId}
              refProjectsExpandBtn={refProjectsExpandBtn}
              ToggleProjectList={ToggleProjectList}
              OpenProject={OpenProject}
              toggleProjectMenu={toggleProjectMenu}
              toggleChatMenu={toggleChatMenu}
              handleProjectDelete={handleProjectDelete}
              handleChatDelete={handleChatDelete}
              handleMoveChat={handleMoveChat}
              handleChatRename={handleChatRename}
              OpenChat={OpenChat}
              CreateProjectPopup={CreateProjectPopup}
              handleProjectCustomize={handleProjectCustomize}
            />

            <ChatSection
              chats={chats}
              projects={projects}
              showProjects={showProjects}
              showChats={showChats}
              chatsWindowHeight={chatsWindowHeight}
              chatMenuId={chatMenuId}
              refChatsExpandBtn={refChatsExpandBtn}
              ToggleChatList={ToggleChatList}
              toggleChatMenu={toggleChatMenu}
              OpenChat={OpenChat}
              handleChatDelete={handleChatDelete}
              handleMoveChat={handleMoveChat}
              handleChatRename={handleChatRename}
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
            onOpenSettings={onOpenSettings}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
