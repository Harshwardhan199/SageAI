// components/home/sidebar/FolderPopup.jsx

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
      <div className="fixed top-1/2 left-1/2 h-auto w-[400px] z-50 bg-[#191919] rounded-2xl shadow-gray-500 flex flex-col transform -translate-x-1/2 -translate-y-1/2 text-white">
        <div className="relative flex flex-col gap-5 px-10 py-10">
          {/* Close */}
          <div className="absolute right-3 top-3 flex items-center rounded-full p-2 hover:bg-[#1c1c1c]">
            <button onClick={CreateFolderPopup}>
              <img
                src="https://img.icons8.com/?size=100&id=46&format=png&color=ffffff"
                alt="Close"
                className="h-auto w-[14px]"
              />
            </button>
          </div>

          {/* Title */}
          <div className="flex justify-center w-full text-[20px]">
            New Folder
          </div>

          {/* Folder Name */}
          <div className="flex gap-2">
            <label>Name -</label>

            <input
              type="text"
              className="w-[250px] border-b border-white outline-none text-white indent-1 bg-transparent"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </div>

          {/* Folder Color */}
          <div className="flex gap-3">
            <label>Color -</label>

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
                    className={`relative appearance-none w-4 h-4 ${color}
                    rounded-sm checked:${checkedColor}
                    checked:border-transparent
                    focus:outline-none peer`}
                    checked={folderColor === color}
                    onChange={() => setFolderColor(color)}
                  />

                  <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 peer-checked:block">
                    <img
                      src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff"
                      alt="Selected"
                      className="w-[8px] h-auto"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-center w-full">
            <button
              className="px-3 py-1 mt-[10px] rounded-lg bg-[#155dfc] text-[18px]"
              onClick={handleFolderCreate}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FolderPopup;
