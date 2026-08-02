import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { config } from "../../config";
import { projectService } from "../../services/projectService";
import { chatService } from "../../services/chatService";

import Sidebar from "./sidebar/Sidebar";
import ProjectPopup from "./sidebar/ProjectPopup";
import TitleBar from "./main/TitleBar";
import ChatArea from "./main/ChatArea";
import Message from "./message/Message";
import SettingsPanel from "../settings/SettingsPanel";
import ImageViewer from "../common/ImageViewer";
import ConfirmationModal from "../common/ConfirmationModal";

const Home = ({ initialShowSettings = false }) => {
  const navigate = useNavigate();
  const { chatId: urlChatId, projectId: urlProjectId } = useParams();

  // User
  const { accessToken, clearAuth, user, setUser } = useAuth();
  const [username, setUsername] = useState("");

  // Settings Panel
  const [showSettings, setShowSettings] = useState(initialShowSettings);

  // Sidebar Toggle
  const refSidebar = useRef(null);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [leftSideToggleClicked, setLeftSideToggleClicked] = useState(false);

  // Other refs in Sidebar
  const refLogo = useRef(null);

  // State for Saved Prompts
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [showSavedPrompts, setShowSavedPrompts] = useState(false);

  // Standalone / Ungrouped Chats
  const [showChats, setShowChats] = useState(true);
  const [chatsWindowHeight, setChatWindowHeight] = useState("0px");

  const [chats, setChats] = useState([]);
  const [chatsCount, setChatsCount] = useState(0);

  const [chatMenuId, setChatMenuId] = useState(null);
  const refChatsExpandBtn = useRef(null);

  // All Projects
  const [showProjects, setShowProjects] = useState(true);
  const [projectsWindowHeight, setProjectsWindowHeight] = useState("0px");

  const [projects, setProjects] = useState([]);
  const [projectMenuId, setProjectMenuId] = useState(null);

  const [projectPopup, setProjectPopup] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectSharedContext, setProjectSharedContext] = useState("");
  const [editingProjectId, setEditingProjectId] = useState(null);

  const refProjectsExpandBtn = useRef(null);

  // Project Chats Accordion Open State
  const [openProjects, setOpenProjects] = useState({});

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

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
    onConfirm: null,
  });

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const [responseHeight, setResponseHeight] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Edit Message state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedPrompt, setEditedPrompt] = useState("");

  const handleStartEdit = (messageId, initialText) => {
    setEditingMessageId(messageId);
    setEditedPrompt(initialText);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedPrompt("");
  };

  const handleEditSend = async (messageId, newPromptText) => {
    const trimmed = newPromptText.trim();
    if (!trimmed || loading) return;

    setEditingMessageId(null);
    setEditedPrompt("");

    await handleDeleteMessage(messageId);
    await handlePrompt(trimmed);
  };

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

    if (refLogo.current) {
      refLogo.current.style.width = "40px";
      refLogo.current.style.height = "40px";
      refLogo.current.src = "/logo-nobg.png";
    }

    setLeftSideToggleClicked(false);

    setTimeout(() => {
      if (refSidebar.current?.matches(":hover")) {
        setSidebarHover(true);
      }
    }, 300);
  };

  const handleMouseEnter = () => {
    const sidebarWidth = refSidebar.current?.getBoundingClientRect().width;
    if (sidebarWidth === 58 && !leftSideToggleClicked) {
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
      LoadProjects();
      LoadChats();
      LoadSavedPrompts();
    }
  }, [user]);

  // Synchronize state from URL parameters (/c/:chatId or /p/:projectId)
  useEffect(() => {
    if (urlChatId && urlChatId !== currentChat) {
      setCurrentChat(urlChatId);
      chatService.getChatMessages(urlChatId)
        .then(msgs => setMessages(msgs))
        .catch(err => {
          console.error("Error loading chat from URL:", err.response?.data || err.message);
          setCurrentChat("");
          setMessages([]);
          navigate("/", { replace: true });
        });
    } else if (!urlChatId && !urlProjectId && currentChat) {
      setCurrentChat("");
      setMessages([]);
    }
  }, [urlChatId, urlProjectId]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".menu-container") &&
        !event.target.closest(".options-button")
      ) {
        setProjectMenuId(null);
        setChatMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Project Creation Popup Toggle
  const CreateProjectPopup = () => {
    setProjectName("");
    setProjectColor("");
    setProjectDescription("");
    setProjectSharedContext("");
    setEditingProjectId(null);
    setProjectPopup(!projectPopup);
  };

  // Customize/Edit Project Popup Setup
  const handleProjectCustomize = (project) => {
    setEditingProjectId(project._id);
    setProjectName(project.name);
    setProjectColor(project.color || "");
    setProjectDescription(project.description || "");
    setProjectSharedContext(project.sharedContext || "");
    setProjectPopup(true);
    toggleProjectMenu(null);
  };

  // Project Creation / Update
  const handleProjectCreate = async () => {
    if (!projectName.trim()) return;
    const projectData = {
      name: projectName.trim(),
      color: projectColor,
      description: projectDescription.trim(),
      sharedContext: projectSharedContext.trim(),
    };

    try {
      if (editingProjectId) {
        await projectService.updateProject(editingProjectId, projectData);
      } else {
        await projectService.createProject(projectData);
      }
    } catch (error) {
      console.error(
        editingProjectId ? "Error Updating Project:" : "Error Creating Project:",
        error.response?.data || error.message
      );
      return null;
    }

    LoadProjects();
    CreateProjectPopup();
  };

  // Toggle project options menu
  const toggleProjectMenu = (projectId) => {
    setProjectMenuId((prev) => (prev === projectId ? null : projectId));
    setChatMenuId(null);
  };

  const promptDeleteProject = (projectId) => {
    toggleProjectMenu(null);
    setConfirmModal({
      isOpen: true,
      title: "Delete Project",
      message: "Are you sure you want to delete this project? All chats and shared settings associated with it will be permanently deleted.",
      confirmText: "Delete Project",
      confirmVariant: "danger",
      onConfirm: () => handleProjectDelete(projectId),
    });
  };

  // Project Delete
  const handleProjectDelete = async (projectId) => {
    try {
      const project = projects.find((p) => p._id === projectId);
      if (project && project.chats?.some((c) => c._id === currentChat)) {
        setCurrentChat("");
        setMessages([]);
      }

      await projectService.deleteProject(projectId);
    } catch (error) {
      console.error("Error Deleting Project:", error.response?.data || error.message);
      return null;
    }
    toggleProjectMenu(null);
    LoadProjects();
    LoadChats();
  };

  // Loading Existing Projects
  const LoadProjects = async () => {
    try {
      const loadedProjects = await projectService.getProjects();
      setProjects(loadedProjects);

      const pCount = loadedProjects.length;
      if (showProjects) {
        let fullHeightProjects = pCount * 40 + (pCount - 1) * 4;

        loadedProjects.forEach((p) => {
          if (openProjects[p._id] && p.chats) {
            fullHeightProjects += p.chats.length * 40 + p.chats.length * 4;
          }
        });

        if (pCount === 0) {
          fullHeightProjects = 40;
        }
        setProjectsWindowHeight(`${fullHeightProjects}px`);
      }
    } catch (error) {
      console.error("Error fetching projects:", error.response?.data || error.message);
      return null;
    }
  };

  // Toggling Project list
  const ToggleProjectList = async () => {
    if (!showProjects) {
      let totalHeight = projects.length * 40 + (projects.length - 1) * 4;
      projects.forEach((p) => {
        if (openProjects[p._id] && p.chats) {
          totalHeight += p.chats.length * 40 + p.chats.length * 4;
        }
      });
      setProjectsWindowHeight(`${totalHeight}px`);
    } else {
      setProjectsWindowHeight("0px");
    }

    setShowProjects(!showProjects);
    if (refProjectsExpandBtn.current) {
      refProjectsExpandBtn.current.style.transform = showProjects
        ? "rotate(-90deg)"
        : "rotate(0deg)";
    }
  };

  // Open Project
  const OpenProject = (projectId) => {
    setOpenProjects((prev) => {
      const isCurrentlyOpen = prev[projectId];
      let totalHeight = projects.length * 40 + (projects.length - 1) * 4;

      projects.forEach((p) => {
        if (
          (p._id === projectId && !isCurrentlyOpen) ||
          (p._id !== projectId && prev[p._id])
        ) {
          if (p.chats) {
            totalHeight += p.chats.length * 40 + p.chats.length * 4;
          }
        }
      });

      setProjectsWindowHeight(`${totalHeight}px`);
      return { ...prev, [projectId]: !isCurrentlyOpen };
    });
  };

  // Toggle chat options menu
  const toggleChatMenu = (chatId) => {
    setChatMenuId((prev) => (prev === chatId ? null : chatId));
    setProjectMenuId(null);
  };

  // Move chat to project
  const handleMoveChat = async (chatId, projectId) => {
    try {
      await chatService.moveChat(chatId, projectId);
    } catch (error) {
      console.error("Error Moving Chat:", error.response?.data || error.message);
      return null;
    }

    toggleChatMenu(null);
    LoadChats();
    LoadProjects();
  };

  // New Chat in Project
  const handleNewChatInProject = async (projectId) => {
    if (window.innerWidth < 768) {
      setToggleSidebar(false);
    }
    setCurrentChat("");
    setMessages([]);
    navigate(`/p/${projectId}`);
  };

  // Delete User Message & Truncate Subsequent History
  const handleDeleteMessage = async (messageId) => {
    try {
      const targetIndex = messages.findIndex(
        (m) => m._id === messageId || m.id === messageId || m.tempId === messageId
      );
      if (targetIndex === -1) return;

      const isMongoId = typeof messageId === "string" && /^[0-9a-fA-F]{24}$/.test(messageId);
      if (isMongoId && user) {
        await chatService.deleteMessage(messageId);
      }

      setMessages((prev) => prev.slice(0, targetIndex));
    } catch (error) {
      console.error("Error Deleting Message:", error.response?.data || error.message);
      const targetIndex = messages.findIndex(
        (m) => m._id === messageId || m.id === messageId || m.tempId === messageId
      );
      if (targetIndex !== -1) {
        setMessages((prev) => prev.slice(0, targetIndex));
      }
    }
  };

  const promptDeleteChat = (chatId) => {
    toggleChatMenu(null);
    setConfirmModal({
      isOpen: true,
      title: "Delete Chat",
      message: "Are you sure you want to delete this chat? All messages in this conversation will be permanently removed.",
      confirmText: "Delete Chat",
      confirmVariant: "danger",
      onConfirm: () => handleChatDelete(chatId),
    });
  };

  // Delete Chat
  const handleChatDelete = async (chatId) => {
    try {
      await chatService.deleteChat(chatId);
    } catch (error) {
      console.error("Error Deleting Chat:", error.response?.data || error.message);
      return null;
    }

    if (currentChat === chatId) {
      setCurrentChat("");
      setMessages([]);
      navigate("/");
    }

    toggleChatMenu(null);
    LoadChats();
    LoadProjects();
  };

  // Rename Chat
  const handleChatRename = async (chatId, title) => {
    try {
      await chatService.renameChat(chatId, title);
    } catch (error) {
      console.error("Error Renaming Chat:", error.response?.data || error.message);
      return null;
    }

    LoadChats();
    LoadProjects();
  };

  // Loading Standalone Chats
  const LoadChats = async () => {
    try {
      const res = await api.get("/user/chats");
      const loadedChats = res.data.ungroupedChats || [];
      setChats(loadedChats);
      setChatsCount(loadedChats.length);

      if (showChats) {
        const fullHeightChats = `${loadedChats.length * 40 + (loadedChats.length - 1) * 4}px`;
        setChatWindowHeight(fullHeightChats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error.response?.data || error.message);
      return null;
    }
  };

  // Toggling Chat list
  const ToggleChatList = async () => {
    if (!showChats) {
      const fullHeightChats = `${chatsCount * 40 + (chatsCount - 1) * 4}px`;
      setChatWindowHeight(fullHeightChats);
    } else {
      setChatWindowHeight("0px");
    }

    setShowChats(!showChats);
    if (refChatsExpandBtn.current) {
      refChatsExpandBtn.current.style.transform = showChats
        ? "rotate(-90deg)"
        : "rotate(0deg)";
    }
  };

  // Open Chat
  const OpenChat = async (chatId) => {
    if (window.innerWidth < 768) {
      setToggleSidebar(false);
    }
    navigate(`/c/${chatId}`);
  };

  // Load saved prompts
  const LoadSavedPrompts = async () => {
    try {
      const res = await api.get("/user/getPrompts");
      setSavedPrompts(res.data.savedPrompts);
    } catch (error) {
      console.error("Error fetching saved prompts:", error.response?.data || error.message);
    }
  };

  const TogglePinPrompt = async (promptId) => {
    try {
      await api.post("/user/togglePinPrompt", { promptId }, { withCredentials: true });
      LoadSavedPrompts();
    } catch (error) {
      console.error("Error Toggling pin-Unpin Saved Prompt:", error.response?.data || error.message);
    }
  };

  const DeletePrompt = async (promptId) => {
    try {
      await api.post("/user/deletePrompt", { promptId }, { withCredentials: true });
    } catch (error) {
      console.error("Error Deleting Saved Prompt:", error.response?.data || error.message);
    }
    LoadSavedPrompts();
  };

  // New Chat
  const handleNewChat = async () => {
    if (window.innerWidth < 768) {
      setToggleSidebar(false);
    }
    setCurrentChat("");
    setMessages([]);
    navigate("/");
  };

  // Send prompt req
  const handlePrompt = async (customText) => {
    const promptValue = typeof customText === "string" ? customText : promptText;

    if (
      (promptValue.trim() === "" && !selectedImage && !selectedAudio) ||
      loading === true
    ) {
      return;
    }

    setLoading(true);

    const prompt = promptValue;
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

    let displayText = prompt;
    const indicators = [];
    if (selectedImage) indicators.push("🖼️ [Image Attached]");
    if (selectedAudio) indicators.push("🎵 [Audio Attached]");
    if (indicators.length > 0) {
      displayText = (displayText ? displayText + "\n\n" : "") + indicators.join("\n");
    }
    if (!displayText) {
      displayText = "Multi-Modal Input";
    }

    if (typeof customText !== "string") {
      setPromptText("");
      setSelectedImage(null);
      setSelectedAudio(null);
      if (inputBarRef.current) {
        inputBarRef.current.value = "";
      }
    }

    const userMsgId = `user_${Date.now()}`;
    const botId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { 
        _id: userMsgId,
        sender: "user", 
        role: "user",
        parts: parts,
        blocks: [{ type: "chat", content: displayText }] 
      },
      { sender: "bot", role: "model", blocks: [{ type: "chat", content: "..." }], _id: botId },
    ]);

    if (user) {
      try {
        let createdChatId = currentChat;

        await chatService.streamChat({
          prompt,
          parts,
          model: selectedModel,
          currentChat,
          projectId: urlProjectId,
          onMeta: (meta) => {
            if (meta.currentChat && !currentChat) {
              createdChatId = meta.currentChat;
              setCurrentChat(meta.currentChat);
              navigate(`/c/${meta.currentChat}`);
            }
          },
          onToken: (token, accumulated, cleanContent) => {
            const displayContent = cleanContent || accumulated;
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === botId
                  ? { ...msg, blocks: [{ type: "chat", content: displayContent }] }
                  : msg
              )
            );
          },
          onComplete: (fullText) => {
            try {
              const parsed = JSON.parse(fullText);
              if (parsed && Array.isArray(parsed.blocks)) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg._id === botId ? { ...msg, blocks: parsed.blocks } : msg
                  )
                );
              }
            } catch (e) {
              // Plain markdown response remains in place
            }
          }
        });
      } catch (error) {
        console.error("Error Streaming Prompt:", error.message);
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === botId
              ? {
                  ...msg,
                  blocks: [{ type: "chat", content: `Error: ${error.message}` }],
                }
              : msg
          )
        );
      }
      LoadChats();
    } else {
      // Guest chat prompt
      if (!currentChat) {
        try {
          const promptRes = await axios.post(
            `${config.BACKEND_URL}/api/temp/chat`,
            { prompt, parts, model: selectedModel }
          );
          const resData = promptRes.data.llmResponse;

          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId ? { ...msg, blocks: resData.blocks } : msg
            )
          );

          setCurrentChat(promptRes.data.currentChat);
        } catch (error) {
          console.error("Error Sending Prompt:", error.response?.data || error.message);
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId
                ? {
                    ...msg,
                    blocks: [{ type: "chat", content: `Error: ${error.response?.data?.error || error.message}` }],
                  }
                : msg
            )
          );
        }
      } else {
        try {
          const promptRes = await axios.post(
            `${config.BACKEND_URL}/api/temp/chat`,
            { prompt, parts, model: selectedModel, currentChat }
          );
          const resData = promptRes.data.llmResponse;

          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId ? { ...msg, blocks: resData.blocks } : msg
            )
          );
        } catch (error) {
          console.error("Error Sending Prompt:", error.response?.data || error.message);
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === botId
                ? {
                    ...msg,
                    blocks: [{ type: "chat", content: `Error: ${error.response?.data?.error || error.message}` }],
                  }
                : msg
            )
          );
        }
      }
    }

    setLoading(false);
  };

  const onHitEnter = (e) => {
    if (e.key === "Enter") {
      handlePrompt();
    }
  };

  useLayoutEffect(() => {
    if (latestBotRef.current && latestUserRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      const titlebarHeight = titleBarRef.current?.getBoundingClientRect().height || 0;
      const searchbarHeight = searchBarRef.current?.getBoundingClientRect().height || 0;

      const usableTop = titlebarHeight;
      const usableBottom = viewportHeight - searchbarHeight;

      const visibleHeight = Math.min(rect.bottom, usableBottom) - Math.max(rect.top, usableTop);
      const clampedVisibleHeight = visibleHeight > 0 ? visibleHeight : 0;

      const latestUserHeight = latestUserRef.current.getBoundingClientRect().height;
      const latestBotHeight = latestBotRef.current ? latestBotRef.current.getBoundingClientRect().height : 0;

      const height = clampedVisibleHeight - latestUserHeight - latestBotHeight - 40;
      setResponseHeight(height > 0 ? height : 0);
    }
  }, [messages]);

  useEffect(() => {
    if (latestUserRef.current) {
      latestUserRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length]);

  const promptLogOut = () => {
    setShowProfileMenu(false);
    setConfirmModal({
      isOpen: true,
      title: "Log Out",
      message: "Are you sure you want to log out of your account?",
      confirmText: "Log Out",
      confirmVariant: "danger",
      onConfirm: () => handleLogOut(),
    });
  };

  const handleLogOut = async () => {
    if (user) {
      try {
        await axios.post(
          `${config.BACKEND_URL}/api/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          }
        );
      } catch (err) {
        console.error("Error during API logout:", err);
      }
      clearAuth();
    }
    window.location.href = "/";
  };

  const lastUserIndex = messages.map((m) => m.sender).lastIndexOf("user");
  const lastBotIndex = messages.map((m) => m.sender).lastIndexOf("bot");

  return (
    <>
      <div className="flex min-h-screen bg-background text-primary">
        {toggleSidebar && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden"
            onClick={() => setToggleSidebar(false)}
          />
        )}

        <Sidebar
          user={user}
          username={username}
          accessToken={accessToken}
          toggleSidebar={toggleSidebar}
          sidebarHover={sidebarHover}
          refSidebar={refSidebar}
          refLogo={refLogo}
          refProjectsExpandBtn={refProjectsExpandBtn}
          refChatsExpandBtn={refChatsExpandBtn}
          projects={projects}
          showProjects={showProjects}
          projectsWindowHeight={projectsWindowHeight}
          openProjects={openProjects}
          projectMenuId={projectMenuId}
          chats={chats}
          chatsWindowHeight={chatsWindowHeight}
          showChats={showChats}
          chatMenuId={chatMenuId}
          showProfileMenu={showProfileMenu}
          LeftSideToggle={LeftSideToggle}
          RightSideToggle={RightSideToggle}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          handleNewChat={handleNewChat}
          ToggleProjectList={ToggleProjectList}
          OpenProject={OpenProject}
          toggleProjectMenu={toggleProjectMenu}
          handleProjectDelete={promptDeleteProject}
          CreateProjectPopup={CreateProjectPopup}
          handleProjectCustomize={handleProjectCustomize}
          handleNewChatInProject={handleNewChatInProject}
          ToggleChatList={ToggleChatList}
          OpenChat={OpenChat}
          toggleChatMenu={toggleChatMenu}
          handleChatDelete={promptDeleteChat}
          handleMoveChat={handleMoveChat}
          handleChatRename={handleChatRename}
          setShowProfileMenu={setShowProfileMenu}
          handleLogOut={promptLogOut}
          onOpenSettings={() => setShowSettings(true)}
        />

        <div
          className={`relative flex flex-col min-h-screen bg-background ${
            !toggleSidebar ? "ml-0 md:ml-[58px]" : "ml-0 md:ml-[301px]"
          } transition-all duration-300 ease-in-out w-full`}
        >
          <TitleBar
            user={user}
            username={username}
            currentChat={currentChat}
            chats={chats}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onToggleSidebar={() => setToggleSidebar(!toggleSidebar)}
            savedPrompts={savedPrompts}
            showSavedPrompts={showSavedPrompts}
            setShowSavedPrompts={setShowSavedPrompts}
            TogglePinPrompt={TogglePinPrompt}
            DeletePrompt={DeletePrompt}
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
            toggleSidebar={toggleSidebar}
            onImagePreview={setPreviewImage}
            onDeleteMessage={handleDeleteMessage}
            editingMessageId={editingMessageId}
            editedPrompt={editedPrompt}
            setEditedPrompt={setEditedPrompt}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onEditSend={handleEditSend}
          />
        </div>

        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmVariant={confirmModal.confirmVariant}
          onConfirm={() => {
            if (confirmModal.onConfirm) confirmModal.onConfirm();
            closeConfirmModal();
          }}
          onCancel={closeConfirmModal}
        />

        <ProjectPopup
          projectPopup={projectPopup}
          projectName={projectName}
          projectColor={projectColor}
          projectDescription={projectDescription}
          projectSharedContext={projectSharedContext}
          setProjectName={setProjectName}
          setProjectColor={setProjectColor}
          setProjectDescription={setProjectDescription}
          setProjectSharedContext={setProjectSharedContext}
          CreateProjectPopup={CreateProjectPopup}
          handleProjectCreate={handleProjectCreate}
          editingProjectId={editingProjectId}
        />

        <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

        <ImageViewer
          open={!!previewImage}
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      </div>
    </>
  );
};

export default Home;
