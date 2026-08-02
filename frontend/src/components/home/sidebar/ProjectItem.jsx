import ChatItem from "./ChatItem";
const ProjectItem = ({
  project,
  projects = [],
  isOpen = false,
  projectMenuId,
  chatMenuId,
  OpenProject,
  toggleProjectMenu,
  toggleChatMenu,
  handleProjectDelete,
  handleChatDelete,
  handleMoveChat,
  handleChatRename,
  OpenChat,
  handleProjectCustomize,
  handleNewChatInProject,
}) => {
  const chatsCount = project.chats ? project.chats.length : 0;
  const projectChatsWindowHeight = isOpen
    ? `${chatsCount * 40 + chatsCount * 4}px`
    : "0px";
  return (
    <div>
      {/* Project Title */}
      <div
        className="group"
        onClick={() => OpenProject && OpenProject(project._id)}
        onMouseLeave={() => {
          if (projectMenuId === project._id) {
            toggleProjectMenu(null);
          }
        }}
      >
        <div className="relative rounded-lg border border-default bg-card-bg">
          <div className="flex items-stretch">
            {/* Colored Left Strip */}
            <div className={`w-[7px] rounded-l-lg ${project.color || ""}`} />

            {/* Content */}
            <div className="flex-1 flex items-center justify-between text-primary hover:bg-hover-bg transition-all duration-200 cursor-pointer rounded-r-lg">
              <div className="flex gap-2 p-2.5">
                <div className="flex items-center">
                  <img
                    src={
                      isOpen
                        ? "https://img.icons8.com/?size=100&id=82790&format=png&color=ffffff"
                        : "https://img.icons8.com/?size=100&id=82843&format=png&color=cccccc"
                    }
                    alt="Project"
                    className="w-[20px] h-auto flex-shrink-0 theme-icon-light"
                  />
                </div>

                <div className="text-sm font-semibold">{project.name}</div>
              </div>

              {/* Project Actions (New Chat & Options Menu) */}
              <div className="flex items-center gap-1">
                {/* Direct New Chat Button */}
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800/80 cursor-pointer"
                  title="New Chat in Project"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (handleNewChatInProject) {
                      handleNewChatInProject(project._id);
                    }
                  }}
                >
                  <img
                    src="https://img.icons8.com/?size=100&id=zqRKVWtC1VeY&format=png&color=ffffff"
                    alt="New Chat in Project"
                    className="w-[15px] h-auto flex-shrink-0 theme-icon-light"
                  />
                </div>

                {/* Project Menu Toggle */}
                <div
                  className="relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProjectMenu?.(project._id);
                  }}
                >
                  <img
                    src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd"
                    alt="Options"
                    className="options-button w-[14px] h-auto flex-shrink-0 mx-1.5 theme-icon-light"
                  />

                  {projectMenuId === project._id && (
                    <div
                      className="menu-container absolute left-[0%] top-[140%] flex flex-col gap-1 min-w-28 p-1 bg-card-bg border border-default drop-shadow rounded-lg z-50 text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg hover:bg-hover-bg font-medium cursor-pointer"
                        onClick={() =>
                          handleProjectCustomize?.(project)
                        }
                      >
                        <img
                          src="https://img.icons8.com/?size=100&id=jCmEz2kpksC4&format=png&color=ffffff"
                          alt="Edit"
                          className="w-3.5 h-3.5 theme-icon-light flex-shrink-0"
                        />
                        <span>Edit</span>
                      </div>

                      <div className="h-[1px] w-full bg-default/80 dark:bg-zinc-700/80" />

                      <div
                        className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg hover:bg-hover-bg text-red-600 font-semibold cursor-pointer"
                        onClick={() =>
                          handleProjectDelete?.(project._id)
                        }
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
          </div>
        </div>
      </div>

      {/* Chats inside Project */}
      {project.chats && (
        <div
          className={`flex flex-col item-center w-full gap-1 pl-3 mt-1 transition-all duration-200 ease-in-out ${isOpen ? "opacity-100" : "opacity-0 overflow-hidden"
            }`}
          style={{
            height: projectChatsWindowHeight,
          }}
        >
          {project.chats.map((chat) => (
            <ChatItem
              key={chat._id}
              chat={chat}
              projects={projects}
              currentProject={project}
              chatMenuId={chatMenuId}
              toggleChatMenu={toggleChatMenu}
              OpenChat={OpenChat}
              handleChatDelete={handleChatDelete}
              handleMoveChat={handleMoveChat}
              handleChatRename={handleChatRename}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default ProjectItem;