import { useState } from "react";
import AppearanceSettings from "./AppearanceSettings";
import ChatSettings from "./ChatSettings";
import AboutSettings from "./AboutSettings";
import { useAuth } from "../../context/AuthContext";

const SettingsPanel = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("appearance");

  if (!isOpen) return null;

  const tabs = [
    { id: "appearance", label: "Appearance", iconUrl: "https://img.icons8.com/?size=100&id=8184&format=png&color=000000" },
    { id: "chat", label: "Chat", iconUrl: "https://img.icons8.com/?size=100&id=38977&format=png&color=000000" },
    { id: "account", label: "Account", iconUrl: "https://img.icons8.com/?size=100&id=ywULFSPkh4kI&format=png&color=000000" },
    { id: "about", label: "About", iconUrl: "https://img.icons8.com/?size=100&id=77&format=png&color=000000" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "appearance":
        return <AppearanceSettings />;
      case "chat":
        return <ChatSettings />;
      case "account":
        return (
          <div className="flex flex-col gap-4 text-primary">
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-2">
              Account Information
            </h3>
            {user ? (
              <div className="flex flex-col gap-3 p-4 bg-card-bg border border-default rounded-xl">
                <div className="flex justify-between items-center py-2 border-b border-default/50">
                  <span className="text-sm text-secondary font-medium">Username</span>
                  <span className="text-sm font-semibold">{user.username}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-default/50">
                  <span className="text-sm text-secondary font-medium">Email Address</span>
                  <span className="text-sm font-semibold">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-secondary font-medium">Subscription Tier</span>
                  <span className="text-xs bg-accent/20 text-accent font-semibold px-2 py-0.5 rounded-full">
                    Free Tier
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-card-bg border border-default rounded-xl">
                <p className="text-sm text-secondary mb-3">
                  You are currently logged in as a Guest. Sign up or Log in to sync chats and folders.
                </p>
              </div>
            )}
          </div>
        );
      case "about":
        return <AboutSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Modal Box */}
      <div
        className="relative flex flex-col md:flex-row w-full max-w-3xl h-[85vh] md:h-[550px] bg-background border border-default rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Tabs List */}
        <div className="flex flex-row md:flex-col w-full md:w-[220px] bg-sidebar-bg border-b md:border-b-0 md:border-r border-default p-3 pt-4 gap-1 overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-none">
          <div className="hidden md:block text-lg font-bold text-primary px-3 mb-4">
            Settings
          </div>
          {tabs.map(({ id, label, iconUrl }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === id
                  ? "bg-accent text-white font-semibold shadow-md shadow-accent/25"
                  : "text-secondary hover:bg-hover-bg hover:text-primary"
              }`}
            >
              <img
                src={iconUrl}
                alt={label}
                className={`w-4 h-4 transition-all duration-200 ${
                  activeTab === id ? "invert" : "theme-icon-dark"
                }`}
              />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Header and Scrollable Contents */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-default shrink-0 bg-background/50 backdrop-blur-sm">
            <h2 className="text-base md:text-lg font-bold text-primary capitalize">
              {activeTab}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-default bg-card-bg hover:bg-hover-bg text-secondary hover:text-primary transition-all duration-200 cursor-pointer"
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
