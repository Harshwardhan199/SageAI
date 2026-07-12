// components/home/sidebar/SidebarHeader.jsx

const SidebarHeader = ({
  user,
  toggleSidebar,
  sidebarHover,
  refLogo,
  LeftSideToggle,
  RightSideToggle,
}) => {
  return (
    <div className="flex items-center justify-between h-[55px] w-full rounded-xl bg-[#070707] pb-4 gap-2 overflow-hidden">
      <div className="flex flex-shrink-0 justify-center w-[40px] relative">
        {/* Logo */}
        <img
          src="/logo-nobg.png"
          alt="Logo"
          ref={refLogo}
          className={`invert rounded-full w-[40px] h-[40px] absolute top-[-20px]
          transition-all duration-200 ease-in-out
          ${sidebarHover ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}
        />

        {/* Left Toggle */}
        <div
          className={`flex items-center absolute top-[-14px]
          transition-all duration-200 ease-in-out
          ${sidebarHover ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
        >
          <img
            src="https://img.icons8.com/?size=100&id=xaWB0HfoyY9X&format=png&color=5A5A5A"
            alt="Expand Sidebar"
            className="invert rounded-full w-[25px] h-auto cursor-pointer"
            onClick={user ? LeftSideToggle : undefined}
          />
        </div>
      </div>

      {/* Right Toggle */}
      {toggleSidebar && (
        <div className="flex items-center rounded-xl p-1 hover:bg-[#1e1e1e]">
          <img
            src="https://img.icons8.com/?size=100&id=v3QqTdoWcQln&format=png&color=5A5A5A"
            alt="Collapse Sidebar"
            className="invert rounded-full w-[25px] h-auto cursor-pointer"
            onClick={RightSideToggle}
          />
        </div>
      )}
    </div>
  );
};

export default SidebarHeader;
