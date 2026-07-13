import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { config } from "../../config";

import Sidebar from "./sidebar/Sidebar";
import FolderPopup from "./sidebar/FolderPopup";
import TitleBar from "./main/TitleBar";
import ChatArea from "./main/ChatArea";
import Message from "./message/Message";

const Home = () => {
  const navigate = useNavigate();

  // User
  const { accessToken, setAccessToken, user, setUser } = useAuth();
  const [username, setUsername] = useState("");

  // Sidebar Toggle
  const refSidebar = useRef(null);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [leftSideToggleClicked, setLeftSideToggleClicked] = useState(false);

  // Other ref's in Sidebar
  const refLogo = useRef(null);

  // State for Saved Prompts
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [showSavedPrompts, setShowSavedPrompts] = useState(false);

  // Ungrouped Chats
  const [showChats, setShowChats] = useState(true);
  const [chatsWindowHeight, setChatWindowHeight] = useState("0px");

  const [chats, setChats] = useState([]);
  const [chatsCount, setChatsCount] = useState(0);

  const [chatMenuId, setChatMenuId] = useState(null);

  const refChatsExpandBtn = useRef(null);

  // All Folders
  const [showFolders, setShowFolders] = useState(true);
  const [foldersWindowHeight, setFoldersWindowHeight] = useState("0px");

  const [folders, setFolders] = useState([]);

  const [folderMenuId, setFolderMenuId] = useState(null);

  const [folderPopup, setFolderPopup] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("");
  const [editingFolderId, setEditingFolderId] = useState(null);

  const refFoldersExpandBtn = useRef(null);

  // Folder's Chats
  const [openFolders, setOpenFolders] = useState({});

  // Current chat and its messages
  const [currentChat, setCurrentChat] = useState("");
  const [messages, setMessages] = useState([]);

  const titleBarRef = useRef(null);
  const searchBarRef = useRef(null);

  const inputBarRef = useRef(null);
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);

  const containerRef = useRef(null);
  const latestUserRef = useRef(null);
  const latestBotRef = useRef(null);

  const [responseHeight, setResponseHeight] = useState(0);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Sidebar Toggle
  const LeftSideToggle = () => {
    if (!leftSideToggleClicked) {
      setLeftSideToggleClicked(true);

      setToggleSidebar(!toggleSidebar);

      setSidebarHover(false);
    }
  };

  const RightSideToggle = () => {
    setToggleSidebar(!toggleSidebar);

    // OnClick change image to logo
    refLogo.current.style.width = "40px";
    refLogo.current.style.height = "40px";
    refLogo.current.src = "/logo-nobg.png";

    setLeftSideToggleClicked(false);

    setTimeout(() => {
      if (refSidebar.current?.matches(":hover")) {
        setSidebarHover(true);
      }
    }, 300);
  };

  const handleMouseEnter = () => {
    const sidebarWidth = refSidebar.current.getBoundingClientRect().width;

    if (sidebarWidth == 58 && leftSideToggleClicked == false) {
      setSidebarHover(true);
    }
  };

  const handleMouseLeave = () => {
    setSidebarHover(false);
    setLeftSideToggleClicked(false);
  };

  // On Load
  useEffect(() => {
    if (user) {
      setUsername(user.username);

      LoadFolders();
      LoadChats();
      LoadSavedPrompts();
    }
  }, [user]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".menu-container") &&
        !event.target.closest(".options-button")
      ) {
        setFolderMenuId(null);
        setChatMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Folder Creation Popup Toggle
  const CreateFolderPopup = () => {
    setFolderName("");
    setFolderColor("");
    setEditingFolderId(null);
    setFolderPopup(!folderPopup);
  };

  // Customize/Edit Folder Popup Setup
  const handleFolderCustomize = (folder) => {
    setEditingFolderId(folder._id);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setFolderPopup(true);
    toggleFolderMenu(null);
  };

  // Folder Creation / Update
  const handleFolderCreate = async () => {
    if (!folderName.trim()) return;
    const folderData = {
      name:
        folderName.charAt(0).toUpperCase() + folderName.slice(1).toLowerCase(),
      color: folderColor,
      isPinned: false,
    };

    try {
      if (editingFolderId) {
        await api.post(
          "/user/updateFolder",
          { ...folderData, folderId: editingFolderId },
          { withCredentials: true },
        );
      } else {
        await api.post("/user/createFolder", folderData, {
          withCredentials: true,
        });
      }
    } catch (error) {
      console.error(
        editingFolderId ? "Error Updating Folder:" : "Error Creating Folder:",
        error.response?.data || error.message,
      );
      return null;
    }

    LoadFolders();
    CreateFolderPopup();
  };

  // Toggle folder options menu
  const toggleFolderMenu = (folderId) => {
    setFolderMenuId((prev) => (prev === folderId ? null : folderId));
    setChatMenuId(null);
  };

  // Folder Delete
  const handleFolderDelete = async (folderId) => {
    try {
      const folder = folders.find((f) => f._id === folderId);
      if (folder && folder.chats.some((c) => c._id === currentChat)) {
        setCurrentChat("");
        setMessages([]);
      }

      await api.post(
        "/user/deleteFolder",
        { folderId },
        { withCredentials: true },
      );
    } catch (error) {
      console.error(
        "Error Deleting Folder:",
        error.response?.data || error.message,
      );
      return null;
    }
    toggleFolderMenu(null);
    LoadFolders();
    LoadChats();
  };

  // Loading Existing Folders
  const LoadFolders = async () => {
    // Get User Folders
    let fCount;
    try {
      const res = await api.get("/user/folders");

      const loadedFolders = res.data.folders;

      setFolders(res.data.folders);

      fCount = loadedFolders.length;

      // Show folders - make enough Space
      if (showFolders) {
        let fullHeightFolders = fCount * 40 + (fCount - 1) * 4;

        // Add height for chats of already opened folders
        loadedFolders.forEach((f) => {
          if (openFolders[f._id]) {
            fullHeightFolders += f.chats.length * 40 + f.chats.length * 4;
          }
        });

        if (fCount == 0) {
          fullHeightFolders = 40;
        }
        setFoldersWindowHeight(`${fullHeightFolders}px`);
      }
    } catch (error) {
      console.error(
        "Error fetching folders:",
        error.response?.data || error.message,
      );
      return null;
    }
  };

  // Toggling Folder list
  const ToggleFolderList = async () => {
    if (!showFolders) {
      // Base height: one row per folder
      let totalHeight = folders.length * 40 + (folders.length - 1) * 4;

      // Add chats heights of all already-opened folders
      folders.forEach((f) => {
        if (openFolders[f._id]) {
          totalHeight += f.chats.length * 40 + f.chats.length * 4;
        }
      });

      setFoldersWindowHeight(`${totalHeight}px`);
    } else {
      setFoldersWindowHeight("0px");
    }

    setShowFolders(!showFolders);
    refFoldersExpandBtn.current.style.transform = showFolders
      ? "rotate(-90deg)"
      : "rotate(0deg)";
  };

  // Open Folder
  const OpenFolder = (folderId) => {
    setOpenFolders((prev) => {
      const isCurrentlyOpen = prev[folderId];

      let totalHeight = folders.length * 40 + (folders.length - 1) * 4;

      // total height required by (currently selected folder if its not opened)  & (all opened chats of currently opened folders)
      folders.forEach((f) => {
        if (
          (f._id === folderId && !isCurrentlyOpen) ||
          (f._id !== folderId && prev[f._id])
        ) {
          totalHeight += f.chats.length * 40 + f.chats.length * 4;
        }
      });

      setFoldersWindowHeight(`${totalHeight}px`);

      return { ...prev, [folderId]: !isCurrentlyOpen };
    });
  };

  // Toggle chat options menu
  const toggleChatMenu = (chatId) => {
    setChatMenuId((prev) => (prev === chatId ? null : chatId));
    setFolderMenuId(null);
  };

  // Move chat
  const handleMoveChat = async (chatId, folderId) => {
    try {
      await api.post(
        "/user/moveChat",
        { chatId, folderId },
        { withCredentials: true },
      );
    } catch (error) {
      console.error(
        "Error Moving Chat:",
        error.response?.data || error.message,
      );
      return null;
    }

    toggleChatMenu(null);

    LoadChats();
    LoadFolders();
  };

  // Delete Chat
  const handleChatDelete = async (chatId) => {
    try {
      await api.post("/user/deleteChat", { chatId }, { withCredentials: true });
      console.log("Chat deleted");
    } catch (error) {
      console.error(
        "Error Deleting Chat:",
        error.response?.data || error.message,
      );
      return null;
    }

    if (currentChat === chatId) {
      setCurrentChat("");
      setMessages([]);
    }

    toggleChatMenu(null);
    LoadChats();
    LoadFolders();
  };

  // Rename Chat
  const handleChatRename = async (chatId, title) => {
    try {
      await api.post(
        "/user/renameChat",
        { chatId, title },
        { withCredentials: true },
      );
    } catch (error) {
      console.error(
        "Error Renaming Chat:",
        error.response?.data || error.message,
      );
      return null;
    }

    LoadChats();
    LoadFolders();
  };

  // Loading Existing Chats
  const LoadChats = async () => {
    // Get User Chats
    let cCount;
    try {
      const res = await api.get("/user/chats");

      setChats(res.data.ungroupedChats);
      //console.log("Chats: ", res.data.ungroupedChats);

      cCount = res.data.ungroupedChats.length;
      setChatsCount(res.data.ungroupedChats.length);
    } catch (error) {
      console.error(
        "Error fetching chats:",
        error.response?.data || error.message,
      );
      return null;
    }

    // Show chats - make enough Space
    if (showChats) {
      const fullHeightChats = `${cCount * 40 + (cCount - 1) * 4}px`;

      setChatWindowHeight(fullHeightChats);
    }
    return null;
  };

  // Toggling Chat list
  const ToggleChatList = async () => {
    if (!showChats) {
      const fullHeightChats = `${chatsCount * 40 + (chatsCount - 1) * 4}px`;
      setChatWindowHeight(fullHeightChats);
    } else {
      const fullHeightChats = `${0}px`;
      setChatWindowHeight(fullHeightChats);
      requestAnimationFrame(() => {
        setChatWindowHeight("0px");
      });
    }

    setShowChats(!showChats);
    refChatsExpandBtn.current.style.transform = showChats
      ? "rotate(-90deg)"
      : "rotate(0deg)";
  };

  // Open Chat
  const OpenChat = async (chatId) => {
    //console.log(chatId);

    setCurrentChat(chatId);

    try {
      const pastMessages = await api.post(
        "/user/getChat",
        { chatId },
        { withCredentials: true },
      );
      setMessages(pastMessages.data.messages);

      console.log(pastMessages.data.messages);
    } catch (error) {
      console.error(
        "Error getting Chat messages:",
        error.response?.data || error.message,
      );
    }
  };

  //Load saved prompts
  const LoadSavedPrompts = async () => {
    try {
      const res = await api.get("/user/getPrompts");

      setSavedPrompts(res.data.savedPrompts);
    } catch (error) {
      console.error(
        "Error fetching saved prompts:",
        error.response?.data || error.message,
      );
    }
  };

  const TogglePinPrompt = async (promptId) => {
    try {
      await api.post(
        "/user/togglePinPrompt",
        { promptId },
        { withCredentials: true },
      );
      LoadSavedPrompts();
    } catch (error) {
      console.error(
        "Error Toggling pin-Unpin Saved Prompt:",
        error.response?.data || error.message,
      );
    }
  };

  const DeletePrompt = async (promptId) => {
    try {
      await api.post(
        "/user/deletePrompt",
        { promptId },
        { withCredentials: true },
      );
    } catch (error) {
      console.error(
        "Error Deleting Saved Prompt:",
        error.response?.data || error.message,
      );
    }

    LoadSavedPrompts();
  };

  // New Chat
  const handleNewChat = async () => {
    setCurrentChat("");
    setMessages([]);
  };

  // Send prompt req
  const handlePrompt = async () => {
    if (
      (promptText.trim() === "" && !selectedImage && !selectedAudio) ||
      loading === true
    ) {
      return;
    }

    setLoading(true);

    const prompt = promptText;
    const parts = [];
    if (prompt.trim()) {
      parts.push({ type: "text", value: prompt });
    }
    if (selectedImage) {
      parts.push({ type: "image", url: selectedImage });
    }
    if (selectedAudio) {
      parts.push({ type: "audio", url: selectedAudio });
    }

    // Build user message display text containing attachment indicators
    let displayText = prompt;
    const indicators = [];
    if (selectedImage) indicators.push("🖼️ [Image Attached]");
    if (selectedAudio) indicators.push("🎵 [Audio Attached]");
    if (indicators.length > 0) {
      displayText =
        (displayText ? displayText + "\n\n" : "") + indicators.join("\n");
    }
    if (!displayText) {
      displayText = "Multi-Modal Input";
    }

    // Clear input states immediately
    setPromptText("");
    setSelectedImage(null);
    setSelectedAudio(null);
    if (inputBarRef.current) {
      inputBarRef.current.value = "";
    }

    const botId = Date.now();
    setMessages((prev) => [
      ...prev,
      { sender: "user", blocks: [{ type: "chat", content: displayText }] },
      { sender: "bot", blocks: [{ type: "chat", content: "..." }], _id: botId },
    ]);

    if (user) {
      // New chat prompt
      if (!currentChat) {
        try {
          const promptRes = await api.post(
            "/user/chat",
            { prompt, parts, model: selectedModel },
            { withCredentials: true },
          );
          const resData = promptRes.data.llmResponse;
          console.log("RES: ", resData);
          // response
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId ? { ...msg, blocks: resData.blocks } : msg,
            ),
          );

          setCurrentChat(promptRes.data.currentChat);
        } catch (error) {
          console.error(
            "Error Sending Prompt:",
            error.response?.data || error.message,
          );
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId
                ? {
                    ...msg,
                    blocks: [{ type: "chat", content: `Error: ${error.response?.data?.error || error.message}` }],
                  }
                : msg,
            ),
          );
        }

        LoadChats();
      } else {
        // Prompt on continued chat
        try {
          const promptRes = await api.post(
            "/user/chat",
            { prompt, parts, model: selectedModel, currentChat },
            { withCredentials: true },
          );
          const resData = promptRes.data.llmResponse;

          // response
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId ? { ...msg, blocks: resData.blocks } : msg,
            ),
          );
        } catch (error) {
          console.error(
            "Error Sending Prompt:",
            error.response?.data || error.message,
          );
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId
                ? {
                    ...msg,
                    blocks: [{ type: "chat", content: `Error: ${error.response?.data?.error || error.message}` }],
                  }
                : msg,
            ),
          );
        }
      }
    } else {
      // New chat prompt for guest
      if (!currentChat) {
        try {
          const promptRes = await axios.post(
            `${config.BACKEND_URL}/api/temp/chat`,
            { prompt, parts, model: selectedModel },
          );
          const resData = promptRes.data.llmResponse;

          // response
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId ? { ...msg, blocks: resData.blocks } : msg,
            ),
          );

          setCurrentChat(promptRes.data.currentChat);
        } catch (error) {
          console.error(
            "Error Sending Prompt:",
            error.response?.data || error.message,
          );
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId
                ? {
                    ...msg,
                    blocks: [{ type: "chat", content: `Error: ${error.response?.data?.error || error.message}` }],
                  }
                : msg,
            ),
          );
        }
      } else {
        // Prompt on continued chat for guest
        try {
          const promptRes = await axios.post(
            `${config.BACKEND_URL}/api/temp/chat`,
            { prompt, parts, model: selectedModel, currentChat },
          );
          const resData = promptRes.data.llmResponse;

          // response
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId ? { ...msg, blocks: resData.blocks } : msg,
            ),
          );
        } catch (error) {
          console.error(
            "Error Sending Prompt:",
            error.response?.data || error.message,
          );
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId
                ? {
                    ...msg,
                    blocks: [{ type: "chat", content: `Error: ${error.response?.data?.error || error.message}` }],
                  }
                : msg,
            ),
          );
        }
      }
    }

    setLoading(false);
  };

  // On Hit enter
  const onHitEnter = (e) => {
    if (e.key === "Enter") {
      handlePrompt();
    }
  };

  // Response Area height calculation
  useLayoutEffect(() => {
    if (latestBotRef.current && latestUserRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;

      const titlebarHeight =
        titleBarRef.current?.getBoundingClientRect().height || 0;
      const searchbarHeight =
        searchBarRef.current?.getBoundingClientRect().height || 0;

      const usableTop = titlebarHeight;
      const usableBottom = viewportHeight - searchbarHeight;

      const visibleHeight =
        Math.min(rect.bottom, usableBottom) - Math.max(rect.top, usableTop);
      const clampedVisibleHeight = visibleHeight > 0 ? visibleHeight : 0;

      const latestUserHeight =
        latestUserRef.current.getBoundingClientRect().height;

      const height = clampedVisibleHeight - latestUserHeight - 20;

      setResponseHeight(height > 0 ? height : 0);
    }
  }, [messages]);

  // Scroll to bottom after messages increase
  useEffect(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  // Logout
  const handleLogOut = async () => {
    if (user) {
      await axios.post(
        `${config.BACKEND_URL}/api/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        },
      );

      setAccessToken(null);
      setUser(null);
    }

    navigate("/loginSignUp");
  };

  const lastUserIndex = messages.map((m) => m.sender).lastIndexOf("user");
  const lastBotIndex = messages.map((m) => m.sender).lastIndexOf("bot");

  return (
    <>
      <div className="flex min-h-screen bg-[#151515]">
        <Sidebar
          // User
          user={user}
          username={username}
          accessToken={accessToken}
          // Sidebar UI
          toggleSidebar={toggleSidebar}
          sidebarHover={sidebarHover}
          refSidebar={refSidebar}
          refLogo={refLogo}
          refFoldersExpandBtn={refFoldersExpandBtn}
          refChatsExpandBtn={refChatsExpandBtn}
          // Folder Data
          folders={folders}
          showFolders={showFolders}
          foldersWindowHeight={foldersWindowHeight}
          openFolders={openFolders}
          folderMenuId={folderMenuId}
          // Chat Data
          chats={chats}
          chatsWindowHeight={chatsWindowHeight}
          showChats={showChats}
          chatMenuId={chatMenuId}
          // Profile
          showProfileMenu={showProfileMenu}
          // Actions
          LeftSideToggle={LeftSideToggle}
          RightSideToggle={RightSideToggle}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          handleNewChat={handleNewChat}
          ToggleFolderList={ToggleFolderList}
          OpenFolder={OpenFolder}
          toggleFolderMenu={toggleFolderMenu}
          handleFolderDelete={handleFolderDelete}
          CreateFolderPopup={CreateFolderPopup}
          handleFolderCustomize={handleFolderCustomize}
          ToggleChatList={ToggleChatList}
          OpenChat={OpenChat}
          toggleChatMenu={toggleChatMenu}
          handleChatDelete={handleChatDelete}
          handleMoveChat={handleMoveChat}
          handleChatRename={handleChatRename}
          setShowProfileMenu={setShowProfileMenu}
          handleLogOut={handleLogOut}
        />

        <div
          className={`relative flex flex-1 flex-col items-center justify-center min-h-screen bg-black ${
            !toggleSidebar ? "ml-[58px]" : "ml-[301px]"
          } transition-all duration-300 ease-in-out`}
        >
          <TitleBar
            user={user}
            savedPrompts={savedPrompts}
            showSavedPrompts={showSavedPrompts}
            setShowSavedPrompts={setShowSavedPrompts}
            TogglePinPrompt={TogglePinPrompt}
            DeletePrompt={DeletePrompt}
            handleLogOut={handleLogOut}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />

          <ChatArea
            user={user}
            messages={messages}
            responseHeight={responseHeight}
            lastUserIndex={lastUserIndex}
            lastBotIndex={lastBotIndex}
            latestUserRef={latestUserRef}
            latestBotRef={latestBotRef}
            containerRef={containerRef}
            titleBarRef={titleBarRef}
            searchBarRef={searchBarRef}
            promptText={promptText}
            setPromptText={setPromptText}
            inputBarRef={inputBarRef}
            handlePrompt={handlePrompt}
            onHitEnter={onHitEnter}
            LoadSavedPrompts={LoadSavedPrompts}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            selectedAudio={selectedAudio}
            setSelectedAudio={setSelectedAudio}
          />
        </div>

        <FolderPopup
          folderPopup={folderPopup}
          folderName={folderName}
          folderColor={folderColor}
          setFolderName={setFolderName}
          setFolderColor={setFolderColor}
          CreateFolderPopup={CreateFolderPopup}
          handleFolderCreate={handleFolderCreate}
          editingFolderId={editingFolderId}
        />
      </div>
    </>
  );
};

export default Home;
