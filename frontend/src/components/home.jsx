import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import api from "../api/axios";
import { useAuth, authStore } from "../context/AuthContext";
import { config } from "../config";

import Message from "./message"

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
    const [showSavedPrompts, setShowSavedPrompts] = useState(false);

    // Ungrouped Chats 
    const [showChats, setShowChats] = useState(true);
    const [chatsWindowHeight, setChatWindowHeight] = useState("0px");

    const [chats, setChats] = useState([]);
    const [chatsCount, setChatsCount] = useState(0);

    const [chatMenuId, setChatMenuId] = useState(null);
    const chatMenuRef = useRef(null);

    const refChatsExpandBtn = useRef(null);

    // All Folders
    const [showFolders, setShowFolders] = useState(true);
    const [foldersWindowHeight, setFoldersWindowHeight] = useState("0px");

    const [folders, setFolders] = useState([]);

    const [folderMenuId, setFolderMenuId] = useState(null);
    const folderMenuRef = useRef(null);

    const [folderPopup, setFolderPopup] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [folderColor, setFolderColor] = useState("");

    const refFoldersExpandBtn = useRef(null);
    const refFolderChat = useRef(null);

    // Folder's Chats
    const [openFolders, setOpenFolders] = useState({});

    // Current chat and its messages
    const [currentChat, setCurrentChat] = useState("");
    const [messages, setMessages] = useState([]);

    const titleBarRef = useRef(null);
    const searchBarRef = useRef(null);

    const inputBarRef = useRef(null);
    const [promptText, setPromptText] = useState("");

    const containerRef = useRef(null);
    const latestUserRef = useRef(null);
    const latestBotRef = useRef(null);

    const [responseHeight, setResponseHeight] = useState(0);

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

        const fetchInfo = async () => {
            // Get User Info
            try {                
                const res = await axios.get(`${config.BACKEND_URL}/api/user/me`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                setUsername(res.data.username);

                LoadFolders();
                LoadChats();

            } catch (error) {
                if (error.response?.status === 401) {
                    try {
                        const refRes = await axios.post(`${config.BACKEND_URL}/api/auth/refresh`, {}, { withCredentials: true });

                        authStore.updateAccessToken(refRes.data.accessToken);
                        authStore.setUser(refRes.data.user.username);

                        setUsername(refRes.data.user.username);

                        LoadFolders();
                        LoadChats();

                    } catch (refreshError) {
                        //console.error("Error refreshing token:", refreshError.response?.data || refreshError.message);
                        toast.error("Session expired. Please log in again.");
                        
                        authStore.updateAccessToken(null);
                        authStore.setUser(null);
                        setUsername(null);

                    }
                } else {
                    //console.error("Error fetching user info:", error.response?.data || error.message);
                    toast.error("Failed to load user data. Please refresh the page.");
                }
            }

        };

        fetchInfo();

    }, []);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".menu-container") &&
                !event.target.closest(".options-button")) {
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
        setFolderPopup(!folderPopup);
    };

    // Folder Creation
    const handleFolderCreate = async () => {

        const folderData = {
            name: folderName.charAt(0).toUpperCase() + folderName.slice(1).toLowerCase(),
            color: folderColor,
            isPinned: false
        };

        //console.log(folderData);

        try {
            const res = await api.post("/user/createFolder", folderData, { withCredentials: true });

            //console.log("Folder Data: ", res.data);

        } catch (error) {
            console.error("Error Creating Folder:", error.response?.data || error.message);
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
            await api.post("/user/deleteFolder", { folderId }, { withCredentials: true });

        } catch (error) {
            console.error("Error Deleting Folder:", error.response?.data || error.message);
            return null;
        }
        LoadFolders();
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

                let fullHeightFolders = ((fCount * 40) + ((fCount - 1) * 4));

                // Add height for chats of already opened folders
                loadedFolders.forEach(f => {
                    if (openFolders[f._id]) {
                        fullHeightFolders += (f.chats.length * 40) + (f.chats.length * 4);
                    }
                });

                if (fCount == 0) {
                    fullHeightFolders = 40;
                }
                setFoldersWindowHeight(`${fullHeightFolders}px`);
            }

        } catch (error) {
            console.error("Error fetching folders:", error.response?.data || error.message);
            return null;
        }
    };

    // Toggling Folder list
    const ToggleFolderList = async () => {
        if (!showFolders) {
            // Base height: one row per folder
            let totalHeight = (folders.length * 40) + ((folders.length - 1) * 4);

            // Add chats heights of all already-opened folders
            folders.forEach(f => {
                if (openFolders[f._id]) {
                    totalHeight += (f.chats.length * 40) + (f.chats.length * 4);
                }
            });

            setFoldersWindowHeight(`${totalHeight}px`);
        } else {
            setFoldersWindowHeight("0px");
        }

        setShowFolders(!showFolders);
        refFoldersExpandBtn.current.style.transform = showFolders ? "rotate(-90deg)" : "rotate(0deg)";
    };

    // Open Folder 
    const OpenFolder = (folderId) => {

        setOpenFolders(prev => {
            const isCurrentlyOpen = prev[folderId];

            let totalHeight = (folders.length * 40) + ((folders.length - 1) * 4);

            // total height required by (currently selected folder if its not opened)  & (all opened chats of currently opened folders)
            folders.forEach(f => {
                if ((f._id === folderId && !isCurrentlyOpen) || (f._id !== folderId && prev[f._id])) {
                    totalHeight += (f.chats.length * 40) + (f.chats.length * 4);
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
            await api.post("/user/moveChat", { chatId, folderId }, { withCredentials: true });

        } catch (error) {
            console.error("Error Moving Chat:", error.response?.data || error.message);
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

        } catch (error) {
            console.error("Error Deleting Chat:", error.response?.data || error.message);
            return null;
        }

        setMessages([]);

        LoadChats();
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
            console.error("Error fetching chats:", error.response?.data || error.message);
            return null;
        }

        // Show chats - make enough Space
        if (showChats) {
            const fullHeightChats = `${((cCount * 40) + ((cCount - 1) * 4))}px`;

            setChatWindowHeight(fullHeightChats);
        }
        return null;
    };

    // Toggling Chat list
    const ToggleChatList = async () => {
        if (!showChats) {
            const fullHeightChats = `${((chatsCount * 40) + ((chatsCount - 1) * 4))}px`;
            setChatWindowHeight(fullHeightChats);
        } else {
            const fullHeightChats = `${0}px`;
            setChatWindowHeight(fullHeightChats);
            requestAnimationFrame(() => {
                setChatWindowHeight("0px");
            });
        }

        setShowChats(!showChats);
        refChatsExpandBtn.current.style.transform = showChats ? "rotate(-90deg)" : "rotate(0deg)";
    };

    // Open Chat
    const OpenChat = async (chatId) => {
        //console.log(chatId);

        setCurrentChat(chatId);

        try {
            const pastMessages = await api.post("/user/getChat", { chatId }, { withCredentials: true });
            setMessages(pastMessages.data.messages);

            console.log(pastMessages.data.messages);

        } catch (error) {
            console.error("Error getting Chat messages:", error.response?.data || error.message);
        }
    };

    // New Chat 
    const handleNewChat = async () => {
        setCurrentChat("");
        setMessages([]);
    };

    // Send prompt req
    const handlePrompt = async () => {

        if (promptText == "") {
            return null
        }

        let prompt = promptText;
        setPromptText("");

        if (user) {

            const botId = Date.now();
            setMessages((prev) => [...prev, { sender: "user", text: prompt }, { sender: "bot", text: "...", _id: botId },]);

            inputBarRef.current.value = "";

            // New chat prompt
            if (!currentChat) {
                try {
                    const promptRes = await api.post("/user/chat", { prompt }, { withCredentials: true });
                    const resData = promptRes.data.llmResponse

                    //console.log(resData);

                    //response
                    setMessages((prev) => prev.map((msg) => msg._id === botId ? { ...msg, text: resData } : msg));

                    setCurrentChat(promptRes.data.currentChat);

                } catch (error) {
                    console.error("Error Sending Prompt:", error.response?.data || error.message);
                    return null;
                }

                LoadChats();
                return null
            }

            // Prompt on continued chat
            try {
                const promptRes = await api.post("/user/chat", { prompt, currentChat }, { withCredentials: true });
                const resData = promptRes.data.llmResponse

                console.log(resData);

                //response
                setMessages((prev) => prev.map((msg) => msg._id === botId ? { ...msg, text: resData } : msg));

            } catch (error) {
                console.error("Error Sending Prompt:", error.response?.data || error.message);
                return null;
            }
        }
        else {
            const botId = Date.now();
            setMessages((prev) => [...prev, { sender: "user", text: prompt }, { sender: "bot", text: "...", _id: botId },]);

            // Temp chat prompt
            try {
                const promptRes = await axios.post(`${config.BACKEND_URL}/api/temp/chat`, { prompt });
                const resData = promptRes.data.llmResponse

                //console.log(resData);

                //response
                setMessages((prev) => prev.map((msg) => msg._id === botId ? { ...msg, text: resData } : msg));

            } catch (error) {
                console.error("Error Sending Prompt:", error.response?.data || error.message);
                return null;
            }

        }
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
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

            const titlebarHeight = titleBarRef.current?.getBoundingClientRect().height || 0;
            const searchbarHeight = searchBarRef.current?.getBoundingClientRect().height || 0;

            const usableTop = titlebarHeight;
            const usableBottom = viewportHeight - searchbarHeight;

            const visibleHeight = Math.min(rect.bottom, usableBottom) - Math.max(rect.top, usableTop);
            const clampedVisibleHeight = visibleHeight > 0 ? visibleHeight : 0;

            const latestUserHeight = latestUserRef.current.getBoundingClientRect().height;

            const height = clampedVisibleHeight - latestUserHeight - 40;

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
            await axios.post(`${config.BACKEND_URL}/api/auth/logout`, {}, { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true });

            setAccessToken(null);
            setUser(null);
        }

        navigate("/loginSignUp");
    };

    const lastUserIndex = messages.map(m => m.sender).lastIndexOf("user");
    const lastBotIndex = messages.map(m => m.sender).lastIndexOf("bot");

    return (
        <>
            {/* bg-[radial-gradient(circle_400px_at_0%_100%,rgba(20,80,200,0.2)_0%,rgba(50,120,220,0.1)_60%,rgba(20,80,200,0)_100%),radial-gradient(circle_400px_at_100%_0%,rgba(20,80,200,0.2)_0%,rgba(50,120,220,0.1)_60%,rgba(20,80,200,0)_100%)] */}
            <div className="flex min-h-screen bg-[#151515]">

                {/* Sidebar */}
                <div className="fixed flex top-0 left-0 border-r border-r-[#151515] overflow-visible z-1">
                    <div className={`flex flex-col h-screen items-center py-1 gap-3 bg-[#070707] ${!toggleSidebar ? "w-[58px]" : "w-[301px]"} text-white overflow-visible whitespace-nowrap transition-all duration-300 ease-in-out`}
                        ref={refSidebar}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >

                        <div className="flex flex-col item-center h-full w-full rounded-xl bg-[#070707] p-2 gap-1 overflow-visible">

                            {/* LOGO - Sidebar Toggle Btn */}
                            <div className="flex items-center justify-between h-[55px] w-full rounded-xl bg-[#070707] pb-4 gap-2 overflow-hidden">

                                <div className="flex flex-shrink-0 justify-center w-[40px] relative">
                                    <img src="/logo-nobg.png"
                                        alt="Logo"
                                        className={`invert rounded-full w-[40px] h-[40px] absolute top-[-20px] transition-all duration-200 ease-in-out ${sidebarHover ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}
                                        ref={refLogo}
                                    />

                                    <div className={`flex items-center absolute top-[-14px] transition-all duration-200 ease-in-out ${sidebarHover ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
                                        <img src="https://img.icons8.com/?size=100&id=xaWB0HfoyY9X&format=png&color=5A5A5A" alt="left sidebar" className="invert rounded-full w-[25px] h-[auto]" onClick={LeftSideToggle} />
                                    </div>
                                </div>

                                {toggleSidebar &&
                                    <div className="flex items-center rounded-xl p-1 hover:bg-[#1e1e1e]">
                                        <img src="https://img.icons8.com/?size=100&id=v3QqTdoWcQln&format=png&color=5A5A5A" alt="right sidebar" className="invert rounded-full w-[25px] h-[auto]" onClick={RightSideToggle} />
                                    </div>
                                }
                            </div>

                            {/* New Chat Btn */}
                            <div className="flex w-full mb-1">
                                <div className="flex item-center gap-2 h-[40px] w-full rounded-lg bg-[#155dfc] p-2 text-white overflow-hidden whitespace-nowrap" onClick={handleNewChat}>
                                    <div className="flex items-center flex-shrink-0">
                                        <img src="https://img.icons8.com/?size=100&id=zqRKVWtC1VeY&format=png&color=ffffff" alt="Logo" className="rounded-full w-[24px] h-auto" />
                                    </div>
                                    <div className={`transition-all duration-200 ease-in-out ${!toggleSidebar ? "opacity-0" : "opacity-100"}`}>New Chat</div>
                                </div>
                            </div>

                            {/* Sidebar Main Content (Search, Folder, Folders List, Chat) */}
                            <div className={`transition-all duration-200 ease-in-out overflow-visible whitespace-nowrap ${!toggleSidebar ? "opacity-0" : "opacity-100"}`}>

                                {/* Search Bar */}
                                <div className="flex item-center w-full rounded-lg bg-[#272727] p-2">
                                    <input type="text" placeholder="Search" className="w-full outline-0" />
                                </div>

                                {/* Folder */}
                                <div className={`flex item-center justify-between w-full rounded-xl bg-[#070707] py-2 text-sm mt-[10px]`}>
                                    <div>Folders</div>
                                    <div className="flex item-center justify-center gap-1">
                                        <button className="h-[20px] rounded-md bg-[#272727] px-1 flex-shrink-0" onClick={CreateFolderPopup}>
                                            <img src="https://img.icons8.com/?size=100&id=37784&format=png&color=000000" alt="expand-folders" className="invert w-[10px] h-auto" />
                                        </button>
                                        <button className="h-[20px] rounded-md bg-[#272727] px-1" onClick={ToggleFolderList}>
                                            <img src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A" alt="expand-folders" className="invert w-[10px] h-auto transition-all duration-300" ref={refFoldersExpandBtn} />
                                        </button>
                                    </div>
                                </div>

                                {/* Folders List */}
                                <div className={`flex flex-col gap-1 w-full rounded-lg overflow-visible transition-all duration-300 ease-in-out ${showFolders ? "opacity-100" : "opacity-0"}`} style={{ height: foldersWindowHeight }}>

                                    {(folders.length == 0) &&
                                        <div className="flex w-full mb-1">
                                            <div className="flex item-center gap-2 h-[40px] w-full rounded-lg bg-[#1f1f1f] p-2 text-white overflow-hidden whitespace-nowrap" onClick={CreateFolderPopup}>
                                                <div className="flex items-center flex-shrink-0">
                                                    <img src="https://img.icons8.com/?size=100&id=WDLQ4iMx1qkz&format=png&color=ffffff" alt="Logo" className="w-[24px] h-auto" />
                                                </div>
                                                <div className="transition-all duration-300 ease-in-out">Create New Folder</div>
                                            </div>
                                        </div>
                                    }

                                    {folders.map((folder) => {
                                        const isOpen = openFolders[folder._id];
                                        const chatsCount = folder.chats.length;
                                        const folderChatsWindowHeight = isOpen ? `${(chatsCount * 40) + ((chatsCount - 0) * 4)}px` : "0px";

                                        return (
                                            <div key={folder._id}>

                                                {/* Folder Title Bar */}
                                                <div className={`${folder.color} rounded-lg overflow-visible group`} onClick={() => OpenFolder(folder._id)} >
                                                    <div className="flex item-center justify-between ml-[5px] rounded-r-lg bg-[#1f1f1f] overflow-visible">
                                                        <div className="flex gap-2 p-2">
                                                            <div className="flex items-center">
                                                                <img src={`${isOpen ? "https://img.icons8.com/?size=100&id=82790&format=png&color=ffffff" : "https://img.icons8.com/?size=100&id=82843&format=png&color=cccccc"}`}
                                                                    alt="Folder"
                                                                    className="w-[20px] h-auto flex-shrink-0"
                                                                />
                                                            </div>
                                                            <div>{folder.name}</div>
                                                        </div>
                                                        <div className="relative flex items-center overflow-visible opacity-0 group-hover:opacity-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFolderMenu(folder._id)
                                                            }}
                                                        >
                                                            <img src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd"
                                                                alt="options"
                                                                className="options-button w-[14px] h-auto flex-shrink-0 mx-2"
                                                            />
                                                            {folderMenuId === folder._id && (
                                                                <div className="menu-container absolute -left-[15px] top-full flex flex-col gap-1 p-1 bg-[#272727] border-1 border-[#393939] drop-shadow rounded-lg z-1" ref={folderMenuRef} onClick={(e) => e.stopPropagation()}>
                                                                    <div className="px-3 py-1 rounded-lg hover:bg-[#323232]">Customize</div>
                                                                    <div className="h-[1px] w-full bg-[#393939]"></div>
                                                                    <div className="px-3 py-1 rounded-lg hover:bg-[#323232]" onClick={() => handleFolderDelete(folder._id)}>Delete</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Folder's Chat */}
                                                <div className={`flex flex-col item-center w-full pl-3 transition-all duration-200 ease-in-out ${isOpen ? "opacity-100" : "opacity-0 overflow-hidden"}`} style={{ height: folderChatsWindowHeight }} >
                                                    {folder.chats.map((chat) => (
                                                        <div className="flex flex-col item-center justify-between w-full rounded-lg bg-[#272727] gap-1 mt-1 overflow-visible group/chat" key={chat._id} onClick={() => OpenChat(chat._id)} >
                                                            <div className="flex justify-between gap-2 overflow-visible">
                                                                <div className="flex flex-1 items-center gap-2 p-2 overflow-hidden">
                                                                    <div className="flex items-center w-full"><span className="truncate flex-1">{chat.title}</span></div>
                                                                </div>

                                                                <div className="relative flex items-center overflow-visible opacity-0 group-hover/chat:opacity-100"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleChatMenu(chat._id)
                                                                    }}
                                                                >
                                                                    <img
                                                                        src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd"
                                                                        alt="options"
                                                                        className="options-button w-[14px] h-auto mx-2"
                                                                    />
                                                                    {chatMenuId === chat._id && (
                                                                        <div className="menu-container absolute -left-[15px] top-full flex flex-col gap-1 min-w-23 p-1 bg-[#272727] border-1 border-[#393939] drop-shadow rounded-lg z-1" ref={chatMenuRef} onClick={(e) => e.stopPropagation()}>
                                                                            <div className="px-3 py-1 rounded-lg hover:bg-[#323232]">Rename</div>
                                                                            <div className="h-[1px] w-full bg-[#393939]"></div>
                                                                            <div className="relative group">
                                                                                <div className="px-4 py-1 rounded-lg hover:bg-[#323232] flex justify-between items-center cursor-pointer gap-2">
                                                                                    <div>Move to</div>
                                                                                    <img src="https://img.icons8.com/?size=100&id=61&format=png&color=ffffff" alt="Move to" className="h-[14px]" />
                                                                                </div>                                                                                <div className="absolute left-[97%] top-0 ml-1 hidden group-hover:flex flex-col gap-1 min-w-28 p-1 bg-[#272727] border border-[#393939] drop-shadow rounded-lg z-20">
                                                                                    {folders.filter(f => f._id !== folder._id).map((f) => (
                                                                                        <div key={f._id} className="px-3 py-1 rounded-lg hover:bg-[#323232]" onClick={() => handleMoveChat(chat._id, f._id)}>{f.name}</div>
                                                                                    ))}
                                                                                    <div className="h-[1px] w-full bg-[#393939]"></div>
                                                                                    <div className="px-3 py-1 rounded-lg hover:bg-[#323232]" onClick={() => handleMoveChat(chat._id, null)}>Ungroup</div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="h-[1px] w-full bg-[#393939]"></div>
                                                                            <div className="px-3 py-1 rounded-lg hover:bg-[#323232]" onClick={() => handleChatDelete(chat._id)}>Delete</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Chats */}
                                {chats.length > 0 &&
                                    <div className={`flex item-center justify-between w-full rounded-xl bg-[#070707] py-2 text-sm transition-all duration-100 ease-in-out ${showFolders ? "mt-[10px]" : "mt-[0px]"}`}>
                                        <div>Chats</div>
                                        <div className="flex item-center justify-center gap-1">
                                            <button className="h-[20px] rounded-md bg-[#272727] px-1" onClick={ToggleChatList}>
                                                <img src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A" alt="expand-folders" className="invert w-[10px] h-auto transition-all duration-300" ref={refChatsExpandBtn} />
                                            </button>
                                        </div>
                                    </div>}

                            </div>

                            {/* Chats List */}
                            <div className={`overflow-visible transition-all duration-200 ease-in-out ${showChats ? "opacity-100" : "opacity-0"}`} style={{ height: chatsWindowHeight }}>

                                <div className={`flex flex-col gap-1 item-center w-full transition-all duration-300 ease-in-out overflow-visible whitespace-nowrap ${!toggleSidebar ? "opacity-0" : "opacity-100"}`}>
                                    {chats.map((chat) => (
                                        <div className="flex flex-col item-center justify-between w-full rounded-lg bg-[#272727] gap-1 overflow-visible group/chat" key={chat._id} onClick={() => OpenChat(chat._id)}>
                                            <div className="flex justify-between gap-2 overflow-visible">
                                                <div className="flex flex-1 items-center gap-2 p-2 overflow-hidden">
                                                    <div className="flex items-center w-full"><span className="truncate flex-1">{chat.title}</span></div>
                                                </div>

                                                <div className="relative flex items-center overflow-visible opacity-0 group-hover/chat:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleChatMenu(chat._id)
                                                    }}
                                                >
                                                    <img src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd"
                                                        alt="options"
                                                        className="options-button w-[14px] h-auto mx-2"
                                                    />
                                                    {chatMenuId === chat._id && (
                                                        <div className="menu-container absolute -left-[15px] top-full flex flex-col gap-1 min-w-23 p-1 bg-[#272727] border-1 border-[#393939] drop-shadow rounded-lg z-1" ref={chatMenuRef} onClick={(e) => e.stopPropagation()}>
                                                            <div className="px-3 py-1 rounded-lg hover:bg-[#323232]">Rename</div>
                                                            <div className="h-[1px] w-full bg-[#393939]"></div>
                                                            <div className="relative group">
                                                                <div className="px-4 py-1 rounded-lg hover:bg-[#323232] flex justify-between items-center cursor-pointer gap-2">
                                                                    <div>Move to</div>
                                                                    <img src="https://img.icons8.com/?size=100&id=61&format=png&color=ffffff" alt="Move to" className="h-[14px]" />
                                                                </div>
                                                                <div className="absolute left-[97%] top-0 ml-1 hidden group-hover:flex flex-col gap-1 min-w-28 p-1 bg-[#272727] border border-[#393939] drop-shadow rounded-lg z-20">
                                                                    {folders.map((folder) => (
                                                                        <div key={folder._id} className="px-3 py-1 rounded-lg hover:bg-[#323232]" onClick={() => handleMoveChat(chat._id, folder._id)}>{folder.name}</div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="h-[1px] w-full bg-[#393939]"></div>
                                                            <div className="px-3 py-1 rounded-lg hover:bg-[#323232]" onClick={() => handleChatDelete(chat._id)}>Delete</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>

                            {/* <div className="flex items-center"
                                    <img src="https://img.icons8.com/?size=100&id=87085&format=png&color=ffffff" alt="chat" className="w-[20px] h-auto" />
                                </div> */}

                            {/* Chats Bottom Line */}
                            <div className="h-1 w-full"></div>

                            {/* User Info Part */}
                            <div className={`absolute left-0 bottom-0 flex items-center w-full py-1 pl-[4px] border-t-1 border-[#272727] gap-2 bg-[#070707] transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap ${toggleSidebar ? "w-[268px]" : "w-[58px]"}`}>

                                <div className="flex items-center justify-center h-[35px] w-[35px]  rounded-full m-2 bg-[#323232] flex-shrink-0" onClick={handleLogOut}>
                                    <img src="https://img.icons8.com/?size=100&id=98957&format=png&color=ffffff" alt="Profile" className="h-[25px] w-[25px]" />
                                </div>

                                {/* onClick={getName} */}
                                <div className={`${toggleSidebar ? "opacity-100 w-auto" : "opacity-0 w-0"} overflow-hidden transition-all duration-300`} >
                                    <div className="text-[14px]">{username || "Log In"}</div>
                                    <div className="text-[10px]">Free</div>
                                </div>

                            </div>

                        </div>

                    </div>
                </div>

                {/* Mainarea */}
                <div className={`relative flex flex-1 flex-col items-center justify-center min-h-screen  bg-black ${!toggleSidebar ? "ml-[58px]" : "ml-[301px]"} transition-all duration-300 ease-in-out`}>

                    {/* TitleBar [#161616] */}
                    <div className="sticky top-0 flex w-full justify-between text-white pt-4 pr-8 pb-4 bg-[#030303] border-b border-b-[#151515]" ref={titleBarRef}>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center">
                                {/* <button className="h-[20px]">
                                        <img src="https://img.icons8.com/?size=100&id=40217&format=png&color=1A1A1A" alt="expand-folders" className="invert w-[14px] h-auto" />
                                    </button> */}
                            </div>
                            <div className="text-[20px]">Sage</div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="relative h-[20px]">
                                <img src="https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=000000" alt="Saved prompts" className="invert w-[20px] h-auto" onClick={() => setShowSavedPrompts(!showSavedPrompts)} />
                                {showSavedPrompts && (
                                    <div className="absolute right-0 top-[calc(100%+4px)] flex flex-col min-w-40 max-w-60 gap-1 text-left rounded-lg bg-[#141414] border-2 border-[#212121] drop-shadow">
                                        {/* Header */}
                                        <div className="font-bold mt-2 ml-2">Saved Prompts</div>
                                        <div className="w-full h-[1px] bg-gray-300"></div>

                                        {/* Prompt list */}
                                        <div className="flex flex-col flex-1 divide-y divide-[#212121] min-w-0">
                                            {/* Row 1 */}
                                            <div className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-[#191919]">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <img src="https://img.icons8.com/?size=100&id=104&format=png&color=ffffff" alt="Star" className="shrink-0 w-3 h-3" />
                                                    <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap truncate">Gsgs</div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <img src="https://img.icons8.com/?size=100&id=pNYOTp5DinZ3&format=png&color=ffffff" alt="Copy" className="shrink-0 w-4 h-4" />
                                                    <img src="https://img.icons8.com/?size=100&id=14237&format=png&color=ffffff" alt="Delete" className="shrink-0 w-4 h-4" />
                                                </div>
                                            </div>

                                            {/* Row 2 (note: removed outer flex-1) */}
                                            <div className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-[#191919]">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <img src="https://img.icons8.com/?size=100&id=104&format=png&color=ffffff" alt="Star" className="shrink-0 w-3 h-3" />
                                                    <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap truncate">Fgs kgs stie ba ib aiwb ia</div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <img src="https://img.icons8.com/?size=100&id=pNYOTp5DinZ3&format=png&color=ffffff" alt="Copy" className="shrink-0 w-4 h-4" />
                                                    <img src="https://img.icons8.com/?size=100&id=14237&format=png&color=ffffff" alt="Delete" className="shrink-0 w-4 h-4" />
                                                </div>
                                            </div>

                                            {/* Row 3 */}
                                            <div className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-[#191919]">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <img src="https://img.icons8.com/?size=100&id=104&format=png&color=ffffff" alt="Star" className="shrink-0 w-3 h-3" />
                                                    <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap truncate">Ygd eggssw dhsbsa 5yn</div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <img src="https://img.icons8.com/?size=100&id=pNYOTp5DinZ3&format=png&color=ffffff" alt="Copy" className="shrink-0 w-4 h-4" />
                                                    <img src="https://img.icons8.com/?size=100&id=14237&format=png&color=ffffff" alt="Delete" className="shrink-0 w-4 h-4" />
                                                </div>
                                            </div>

                                            {/* Row 4 */}
                                            <div className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-[#191919]">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <img src="https://img.icons8.com/?size=100&id=104&format=png&color=ffffff" alt="Star" className="shrink-0 w-3 h-3" />
                                                    <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap truncate">Hgsg wearV</div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <img src="https://img.icons8.com/?size=100&id=pNYOTp5DinZ3&format=png&color=ffffff" alt="Copy" className="shrink-0 w-4 h-4" />
                                                    <img src="https://img.icons8.com/?size=100&id=14237&format=png&color=ffffff" alt="Delete" className="shrink-0 w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="w-full h-[1px] bg-gray-300"></div>
                                        <div className="ml-2 mr-2 mb-2 text-sm text-center">Manage all</div>
                                    </div>
                                )}
                            </button>

                            <button className="h-[20px]">
                                <img src="https://img.icons8.com/?size=100&id=g1EQCit0RQ7Z&format=png&color=1A1A1A" alt="Share Chat" className="invert w-[18px] h-auto" />
                            </button>
                        </div>

                    </div>

                    {/* Content */}
                    <div className="flex flex-col w-full flex-1 mt-[1px] items-center justify-center px-2 overflow-y-auto">

                        <div className={`flex max-w-[780px] w-full min-w-[600px] h-min-[500px] rounded-2xl flex-grow-0 overflow-hidden ${messages.length == 0 ? "bg-[#161616]" : "h-full bg-transparent"}`}>

                            <div className={`flex flex-col w-full px-2 pt-4 pb-2 gap-5 flex-grow overflow-y-auto ${messages.length == 0 ? "items-center justify-start" : ""}`} ref={containerRef}>

                                {(messages.length == 0) &&
                                    <div>
                                        <div className="flex flex-col items-center justify-center w-full gap-2 p-8 text-center mt-[10px]" ref={searchBarRef}>

                                            <div>
                                                <img src="/logo.png" alt="Logo" className="rounded-full w-[40px] h-auto" />
                                            </div>

                                            <div className="text-3xl text-white">How can i help you today?</div>

                                            <div className="text-[11.5px] text-[#969696]">This code will display a prompt asking the user for their name, and then it will display a greeting message with the name entered by the user.</div>

                                        </div>

                                        <div className="flex items-center justify-center gap-2 text-center text-[10px] text-[#969696] mt-[10px]">

                                            <div className="flex flex-col  h-[130px] w-[160px] p-3 rounded-xl bg-[#2d2d2d] gap-1">
                                                <div className="flex items-center justify-center">
                                                    <img src="https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=155dfc" alt="Logo" className="w-[30px] h-auto" />
                                                </div>
                                                <div className="text-center text-[16px] leading-5 text-white">Saved Prompt Templates</div>
                                                <div>User saves and reuse prompt templates for faster responses.</div>
                                            </div>

                                            <div className="flex flex-col  h-[130px] w-[160px] p-3 rounded-xl bg-[#2d2d2d] gap-1">
                                                <div className="flex items-center justify-center">
                                                    <img src="https://img.icons8.com/?size=100&id=54127&format=png&color=155dfc" alt="Logo" className="w-[30px] h-auto" />
                                                </div>
                                                <div className="text-center text-[16px] leading-5 text-white">Media Type Selection</div>
                                                <div>Users select media type for tailored interactions.</div>
                                            </div>

                                            <div className="flex flex-col  h-[130px] w-[160px] p-3 rounded-xl bg-[#2d2d2d] gap-1">
                                                <div className="flex items-center justify-center">
                                                    <img src="https://img.icons8.com/?size=100&id=78888&format=png&color=155dfc" alt="Logo" className="w-[30px] h-auto" />
                                                </div>
                                                <div className="text-center text-[16px] leading-5 text-white">Multilingual Support</div>
                                                <div>Choose language for better interaction.</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 w-full mt-12">

                                            <div className="flex justify-center gap-6 text-sm text-[#969696]">
                                                <div>All</div>
                                                <div>Text</div>
                                                <div>Image</div>
                                                <div>Video</div>
                                                <div>Music</div>
                                                <div>Analytics</div>
                                            </div>

                                            <div className="relative w-full rounded-lg bg-white text-black">

                                                <div className="absolute top-[6px] left-[2px]">
                                                    <img src="/logo-nobg.png" alt="Logo" className="rounded-full w-[28px] h-auto" />
                                                </div>

                                                <input
                                                    type="text"
                                                    placeholder="Ask Anything"
                                                    className="h-[40px] w-full indent-8 outline-0"
                                                    value={promptText}
                                                    onChange={(e) => setPromptText(e.target.value)}
                                                    onKeyDown={onHitEnter}
                                                    ref={inputBarRef}
                                                />

                                                <div className="absolute top-[10px] right-[40px]">
                                                    <img src="https://img.icons8.com/?size=100&id=jkqQE2I90I8R&format=png&color=1A1A1A" alt="Logo" className="rounded-full w-[18px] h-auto" />
                                                </div>

                                                <div className="absolute top-[4px] right-[4px] bg-blue-600 p-1 rounded-lg">
                                                    <img src="https://img.icons8.com/?size=100&id=7789&format=png&color=1A1A1A" alt="Send prompt" className="invert rounded-full w-[24px] h-auto" onClick={handlePrompt} />
                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                }

                                {messages.map((msg, idx) => (
                                    <Message
                                        key={msg._id || idx}
                                        sender={msg.sender}
                                        text={msg.text}
                                        style={{ minHeight: idx === lastBotIndex ? `${responseHeight}px` : "auto", }}
                                        ref={idx === lastUserIndex ? latestUserRef : idx === lastBotIndex ? latestBotRef : null}
                                    />
                                ))}

                            </div>

                        </div>

                    </div>

                    {/* SearchBar */}
                    {(messages.length > 0) &&
                        <div className="sticky bottom-0 flex flex-col items-center w-full h-17 bg-black" ref={searchBarRef}>

                            <div className="relative flex justify-center w-full">

                                <div className="absolute -top-2 max-w-[780px] w-full min-w-[600px]">

                                    <div className="relative w-full rounded-lg bg-white text-black">

                                        <div className="absolute top-[6px] left-[2px]">
                                            <img src="/logo-nobg.png" alt="Logo" className="rounded-full w-[28px] h-auto" />
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Ask Anything"
                                            className="h-[40px] w-full indent-8 outline-0"
                                            value={promptText}
                                            onChange={(e) => setPromptText(e.target.value)}
                                            onKeyDown={onHitEnter}
                                            ref={inputBarRef}
                                        />

                                        <div className="absolute top-[10px] right-[40px]">
                                            <img src="https://img.icons8.com/?size=100&id=jkqQE2I90I8R&format=png&color=1A1A1A" alt="Logo" className="rounded-full w-[18px] h-auto" />
                                        </div>

                                        <div className="absolute top-[4px] right-[4px] bg-blue-600 p-1 rounded-lg">
                                            <img src="https://img.icons8.com/?size=100&id=7789&format=png&color=1A1A1A" alt="Send prompt" className="invert rounded-full w-[24px] h-auto" onClick={handlePrompt} />
                                        </div>

                                    </div>
                                </div>
                                <div className="absolute top-10 text-[12px] text-white">SageAI can make mistakes. Check important info.</div>
                            </div>


                        </div>
                    }

                </div>

                {/* Popup window */}
                {folderPopup &&
                    <>
                        {/* {Overlay} */}
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-[40]" onClick={() => setFolderPopup(!folderPopup)}></div>

                        {/* {Popup} */}
                        <div className="fixed top-1/2 left-1/2 h-auto w-[400px] z-50 bg-[#191919] rounded-2xl shadow-gray-500 flex flex-col transform -translate-x-1/2 -translate-y-1/2 text-white">
                            <div className="relative flex flex-col gap-5 px-10 py-10">

                                <div className="absolute right-3 top-3 flex items-center rounded-full p-2 hover:bg-[#1c1c1c]">
                                    <button onClick={() => setFolderPopup(!folderPopup)}>
                                        <img src="https://img.icons8.com/?size=100&id=46&format=png&color=ffffff" alt="Cross" className="h-auto w-[14px]" />
                                    </button>
                                </div>

                                <div className="flex justify-center w-full text-[20px]">New Folder</div>
                                <div className="flex gap-2">
                                    <label htmlFor="adad">Name -</label>
                                    <input
                                        type="text"
                                        className="w-[250px] border-b-1 border-white outline-0 text-white indent-1"
                                        value={folderName}
                                        onChange={(e) => setFolderName(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">

                                    <label>Color -</label>
                                    <div className="flex items-center gap-2">
                                        {[
                                            { id: "c-1", color: "bg-red-500", checkedColor: "bg-red-800" },
                                            { id: "c-2", color: "bg-blue-500", checkedColor: "bg-blue-800" },
                                            { id: "c-3", color: "bg-green-500", checkedColor: "bg-green-800" },
                                            { id: "c-4", color: "bg-yellow-500", checkedColor: "bg-yellow-800" },
                                            { id: "c-5", color: "bg-orange-500", checkedColor: "bg-orange-800" },
                                            { id: "c-6", color: "bg-pink-500", checkedColor: "bg-pink-800" },
                                            { id: "c-7", color: "bg-purple-500", checkedColor: "bg-purple-800" },
                                            { id: "c-8", color: "bg-gray-200", checkedColor: "bg-gray-500" },
                                            { id: "c-9", color: "bg-gray-500", checkedColor: "bg-gray-700" },
                                            { id: "c-10", color: "bg-violet-500", checkedColor: "bg-violet-800" },
                                            { id: "c-11", color: "bg-cyan-500", checkedColor: "bg-cyan-800" },
                                        ].map(({ id, color, checkedColor }) => (
                                            <label key={id} htmlFor={id} className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="color"
                                                    id={id}
                                                    className={`relative appearance-none w-4 h-4 ${color} rounded-sm checked:${checkedColor} checked:border-transparent focus:outline-none peer`}
                                                    onChange={() => setFolderColor(color)}
                                                />
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                    <img
                                                        src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff"
                                                        alt="radio"
                                                        className="h-auto w-[8px]" />
                                                </div>
                                            </label>
                                        ))}

                                    </div>
                                </div>
                                <div className="flex justify-center w-full ">
                                    <button className="px-2 py-[1px] mt-[10px] rounded-lg bg-[#155dfc] text-[18px]" onClick={handleFolderCreate}>Create</button>
                                </div>
                            </div>
                        </div>
                    </>
                }
            </div>
        </>
    )
}

export default Home;