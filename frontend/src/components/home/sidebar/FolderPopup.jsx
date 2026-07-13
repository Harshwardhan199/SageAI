const colors = [
  {
    id: "c-1",
    color: "bg-red-500",
    checkedColor: "bg-red-800",
  },
  {
    id: "c-2",
    color: "bg-blue-500",
    checkedColor: "bg-blue-800",
  },
  {
    id: "c-3",
    color: "bg-green-500",
    checkedColor: "bg-green-800",
  },
  {
    id: "c-4",
    color: "bg-yellow-500",
    checkedColor: "bg-yellow-800",
  },
  {
    id: "c-5",
    color: "bg-orange-500",
    checkedColor: "bg-orange-800",
  },
  {
    id: "c-6",
    color: "bg-pink-500",
    checkedColor: "bg-pink-800",
  },
  {
    id: "c-7",
    color: "bg-purple-500",
    checkedColor: "bg-purple-800",
  },
  {
    id: "c-8",
    color: "bg-gray-200",
    checkedColor: "bg-gray-500",
  },
  {
    id: "c-9",
    color: "bg-gray-500",
    checkedColor: "bg-gray-700",
  },
  {
    id: "c-10",
    color: "bg-violet-500",
    checkedColor: "bg-violet-800",
  },
  {
    id: "c-11",
    color: "bg-cyan-500",
    checkedColor: "bg-cyan-800",
  },
];

const FolderPopup = ({
  folderPopup,
  folderName,
  folderColor,

  setFolderName,
  setFolderColor,

  CreateFolderPopup,
  handleFolderCreate,
  editingFolderId,
}) => {
  if (!folderPopup) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-[40]"
        onClick={CreateFolderPopup}
      />

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 h-auto w-[95%] max-w-[400px] z-50 bg-background border border-default rounded-2xl shadow-2xl flex flex-col transform -translate-x-1/2 -translate-y-1/2 text-primary transition-all">
        <div className="relative flex flex-col gap-5 px-6 sm:px-10 py-8 sm:py-10">
          {/* Close */}
          <div className="absolute right-3 top-3 flex items-center rounded-full p-2 hover:bg-hover-bg">
            <button onClick={CreateFolderPopup} className="cursor-pointer">
              <img
                src="https://img.icons8.com/?size=100&id=46&format=png&color=ffffff"
                alt="Close"
                className="h-auto w-[12px] dark:invert-0 invert"
              />
            </button>
          </div>

          {/* Title */}
          <div className="flex justify-center w-full text-lg sm:text-[20px] font-bold">
            {editingFolderId ? "Edit Folder" : "New Folder"}
          </div>

          {/* Folder Name */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-secondary">Name</label>

            <input
              type="text"
              className="flex-1 border-b border-primary outline-none text-black dark:text-white indent-1 bg-transparent text-sm font-medium"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </div>

          {/* Folder Color */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-secondary">
              Color
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              {colors.map(({ id, color, checkedColor }) => (
                <label
                  key={id}
                  htmlFor={id}
                  className="relative inline-flex items-center cursor-pointer"
                >
                  <input
                    id={id}
                    type="radio"
                    name="folder-color"
                    className={`relative appearance-none w-5 h-5 ${color}
                    rounded-md checked:${checkedColor}
                    checked:border-transparent
                    focus:outline-none peer transition-all`}
                    checked={folderColor === color}
                    onChange={() => setFolderColor(color)}
                  />

                  <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 peer-checked:block pointer-events-none">
                    <img
                      src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff"
                      alt="Selected"
                      className="w-[8px] h-auto dark:invert-0 invert"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-center w-full mt-2">
            <button
              className="px-6 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-md transition-colors cursor-pointer"
              onClick={handleFolderCreate}
            >
              {editingFolderId ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FolderPopup;
