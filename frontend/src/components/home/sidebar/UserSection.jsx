// components/home/sidebar/UserSection.jsx

const UserSection = ({
  user,
  username,
  toggleSidebar,
  showProfileMenu,
  setShowProfileMenu,
  handleLogOut,
}) => {
  // Logged In
  if (user) {
    return (
      <div
        className={`absolute left-0 bottom-0 flex items-center py-1 pl-[4px]
        border-t border-[#272727] gap-2 bg-[#070707]
        transition-all duration-200 ease-in-out overflow-visible whitespace-nowrap
        ${toggleSidebar ? "w-[268px]" : "w-[58px]"}`}
      >
        <div className="relative flex overflow-visible w-full">
          {/* Profile Icon */}
          <div
            className="flex items-center justify-center h-[35px] w-[35px] rounded-full m-2 bg-[#323232] flex-shrink-0 cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <img
              src="https://img.icons8.com/?size=100&id=98957&format=png&color=ffffff"
              alt="Profile"
              className="h-[25px] w-[25px]"
            />
          </div>

          {/* Dropdown */}
          {showProfileMenu && (
            <div className="absolute left-0 bottom-[calc(100%+4px)] flex flex-col gap-1 w-full p-1 drop-shadow z-30">
              {/* Settings */}
              <div className="flex items-center justify-start h-[48px] p-1 bg-[#272727] border border-[#393939] rounded-sm cursor-pointer">
                <div className="flex items-center justify-center h-[30px] w-[35px] flex-shrink-0">
                  <img
                    src="https://img.icons8.com/?size=100&id=UCX4DI82AU0H&format=png&color=ffffff"
                    alt="Settings"
                    className="h-[30px] w-[30px]"
                  />
                </div>

                {toggleSidebar && <p className="p-1">Settings</p>}
              </div>

              {/* Logout */}
              <div
                className="flex items-center justify-start h-[48px] p-1 bg-[#272727] border border-[#393939] rounded-sm cursor-pointer"
                onClick={handleLogOut}
              >
                <div className="flex items-center justify-center h-[30px] w-[35px] flex-shrink-0">
                  <img
                    src="https://img.icons8.com/?size=100&id=Q1xkcFuVON39&format=png&color=ffffff"
                    alt="Logout"
                    className="h-[25px] w-[25px]"
                  />
                </div>

                {toggleSidebar && <p className="p-1">Log Out</p>}
              </div>
            </div>
          )}

          {/* Username */}
          <div
            className={`${
              toggleSidebar ? "opacity-100 w-auto" : "opacity-0 w-0"
            } overflow-hidden transition-all duration-300`}
          >
            <div className="text-[14px]">{username || "Log In"}</div>
            <div className="text-[10px]">Free</div>
          </div>
        </div>
      </div>
    );
  }

  // Guest User
  return (
    <div className="absolute left-0 bottom-0 flex flex-col gap-1 w-full p-1 drop-shadow z-30">
      <div className="flex items-center justify-start h-[48px] p-1 bg-[#272727] border border-[#393939] rounded-sm">
        <div className="flex items-center justify-center h-[30px] w-[35px] flex-shrink-0">
          <img
            src="https://img.icons8.com/?size=100&id=UCX4DI82AU0H&format=png&color=ffffff"
            alt="Profile"
            className="h-[30px] w-[30px]"
          />

          {toggleSidebar && <p className="p-1">Settings</p>}
        </div>
      </div>
    </div>
  );
};

export default UserSection;
