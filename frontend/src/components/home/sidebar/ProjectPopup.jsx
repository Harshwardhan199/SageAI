const ProjectPopup = ({
  projectPopup,
  projectName = "",
  projectColor = "",
  projectDescription = "",
  projectSharedContext = "",
  setProjectName,
  setProjectColor,
  setProjectDescription,
  setProjectSharedContext,
  CreateProjectPopup,
  handleProjectCreate,
  editingProjectId,
}) => {
  if (!projectPopup) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={CreateProjectPopup}
    >
      <div
        className="flex flex-col gap-4 p-5 rounded-2xl bg-card-bg border border-default shadow-2xl w-full max-w-[440px] text-primary transition-all scale-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-default pb-3">
          <h3 className="font-bold text-base">
            {editingProjectId ? "Customize Project" : "Create New Project"}
          </h3>
          <button
            onClick={CreateProjectPopup}
            className="text-secondary hover:text-primary transition-colors text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Project Name */}
          <div>
            <label className="text-xs font-semibold text-secondary mb-1 block">
              Project Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Google Interview Prep"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-background border border-default text-primary text-sm focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="text-xs font-semibold text-secondary mb-1 block">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. System design questions and mock interviews"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-background border border-default text-primary text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Project Shared Context / System Instructions */}
          <div>
            <label className="text-xs font-semibold text-secondary mb-1 block">
              Shared Context / AI Instructions (Optional)
            </label>
            <textarea
              placeholder="e.g. Always respond using Python 3.12, prefer clean architecture, focus on distributed systems edge cases."
              value={projectSharedContext}
              onChange={(e) => setProjectSharedContext(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-background border border-default text-primary text-sm focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <p className="text-[11px] text-secondary mt-1">
              Injected into every chat inside this project as workspace context.
            </p>
          </div>

          {/* Theme Color */}
          <div>
            <label className="text-xs font-semibold text-secondary mb-1.5 block">
              Theme Color
            </label>
            <div className="flex items-center justify-between gap-2">
              {[
                { name: "Blue", class: "bg-blue-500" },
                { name: "Purple", class: "bg-purple-500" },
                { name: "Emerald", class: "bg-emerald-500" },
                { name: "Amber", class: "bg-amber-500" },
                { name: "Rose", class: "bg-rose-500" },
                { name: "Teal", class: "bg-teal-500" },
                { name: "Indigo", class: "bg-indigo-500" },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setProjectColor(c.class)}
                  className={`w-7 h-7 rounded-lg border border-default flex items-center justify-center transition-transform ${
                    c.class || "bg-card-bg"
                  } ${projectColor === c.class ? "scale-110 ring-2 ring-accent" : "hover:scale-105"}`}
                  title={c.name}
                >
                  {projectColor === c.class && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
          <button
            type="button"
            onClick={CreateProjectPopup}
            className="px-4 py-2 text-xs font-semibold rounded-xl hover:bg-hover-bg transition-colors text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProjectCreate}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm"
          >
            {editingProjectId ? "Update Project" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPopup;