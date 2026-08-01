import ProjectItem from "./ProjectItem";

const ProjectSection = ({
  projects = [],
  openProjects = {},
  showProjects = true,
  projectsWindowHeight = "auto",
  projectMenuId,
  chatMenuId,
  refProjectsExpandBtn,
  ToggleProjectList,
  OpenProject,
  toggleProjectMenu,
  toggleChatMenu,
  handleProjectDelete,
  handleChatDelete,
  handleMoveChat,
  handleChatRename,
  OpenChat,
  CreateProjectPopup,
  handleProjectCustomize,
}) => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between w-full rounded-xl bg-transparent py-2 text-sm mt-[10px] text-primary font-bold">
        <div>Projects</div>

        <div className="flex items-center justify-center gap-1">
          <button
            className="h-[20px] rounded-md bg-card-bg border border-default hover:bg-hover-bg px-1 flex-shrink-0 cursor-pointer"
            onClick={CreateProjectPopup}
            title="Create Project"
          >
            <img
              src="https://img.icons8.com/?size=100&id=37784&format=png&color=000000"
              alt="Create Project"
              className="theme-icon-dark w-[10px] h-auto"
            />
          </button>

          {ToggleProjectList && (
            <button
              className="h-[20px] rounded-md bg-card-bg border border-default hover:bg-hover-bg px-1 cursor-pointer"
              onClick={ToggleProjectList}
            >
              <img
                src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A"
                alt="Expand"
                className="theme-icon-dark w-[10px] h-auto transition-all duration-300"
                ref={refProjectsExpandBtn}
              />
            </button>
          )}
        </div>
      </div>

      {/* Project List */}
      <div
        className={`flex flex-col gap-1 w-full rounded-lg overflow-visible transition-all duration-300 ease-in-out ${
          showProjects ? "opacity-100" : "opacity-0"
        }`}
        style={{ height: projectsWindowHeight }}
      >
        {/* Empty State */}
        {projects.length === 0 && (
          <div className="flex w-full mb-1">
            <div
              className="flex items-center gap-2 h-[40px] w-full rounded-lg bg-card-bg border border-default p-2 text-primary hover:bg-hover-bg overflow-hidden whitespace-nowrap cursor-pointer transition-colors duration-200"
              onClick={CreateProjectPopup}
            >
              <div className="flex items-center flex-shrink-0">
                <img
                  src="https://img.icons8.com/?size=100&id=WDLQ4iMx1qkz&format=png&color=ffffff"
                  alt="Create Project"
                  className="w-[24px] h-auto theme-icon-light"
                />
              </div>

              <div className="text-sm font-medium">Create New Project</div>
            </div>
          </div>
        )}

        {/* Project Items */}
        {projects.map((project) => (
          <ProjectItem
            key={project._id}
            project={project}
            projects={projects}
            isOpen={openProjects[project._id]}
            projectMenuId={projectMenuId}
            chatMenuId={chatMenuId}
            OpenProject={OpenProject}
            toggleProjectMenu={toggleProjectMenu}
            toggleChatMenu={toggleChatMenu}
            handleProjectDelete={handleProjectDelete}
            handleChatDelete={handleChatDelete}
            handleMoveChat={handleMoveChat}
            handleChatRename={handleChatRename}
            OpenChat={OpenChat}
            handleProjectCustomize={handleProjectCustomize}
          />
        ))}
      </div>
    </>
  );
};

export default ProjectSection;
