import { useRef, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Home = () => {
    const navigate = useNavigate();

    const { accessToken, setAccessToken, user, setUser } = useAuth();

    const [username, setUsername] = useState("");

    const [toggleSidebar, setToggleSidebar] = useState(false);
    const [sidebarHover, setSidebarHover] = useState(false);
    const [leftSideToggleClicked, setLeftSideToggleClicked] = useState(false);

    const [showChats, setShowChats] = useState(true);
    const [chatsWindowHeight, setChatWindowHeight] = useState("0px");

    const [showFolders, setShowFolders] = useState(true);
    const [foldersWindowHeight, setFoldersWindowHeight] = useState("0px");

    const [folderPopup, setFolderPopup] = useState(false);

    const refSidebar = useRef(null);

    const refLogo = useRef(null);

    const refNewChat = useRef(null);

    const refChatsWindow = useRef(null);
    const refFoldersWindow = useRef(null);

    const refFoldersExpandBtn = useRef(null);
    const refFolderChat = useRef(null);

    const refChatsExpandBtn = useRef(null);
    const refChats = useRef(null);

    const refMainarea = useRef(null);

    const LeftSideToggle = () => {
        if (!leftSideToggleClicked) {

            setLeftSideToggleClicked(true);

            setToggleSidebar(!toggleSidebar);

            // Sidebar width change
            refSidebar.current.style.width = "300px";

            // OnClick change image to logo
            setSidebarHover(false);

            // Opacity cal of New Chat container
            const newChatOpacity = window.getComputedStyle(refNewChat.current).opacity;

            // New Chat opacity change setup
            if (newChatOpacity < 0.5) {
                refNewChat.current.style.opacity = 1;

                refFolderChat.current.style.opacity = 1;

                refChats.current.style.opacity = 1;
            }
            else {
                refNewChat.current.style.opacity = 0;

                refFolderChat.current.style.opacity = 0;

                refChats.current.style.opacity = 0;
            }

            // Mainarea width change
            refMainarea.current.style.marginLeft = "300px";
        }

    };

    const RightSideToggle = () => {
        setToggleSidebar(!toggleSidebar);

        // Sidebar width change
        refSidebar.current.style.width = "90px";

        // OnClick change image to logo
        refLogo.current.style.width = "40px";
        refLogo.current.style.height = "40px";
        refLogo.current.src = "/logo-nobg.png";

        // Opacity cal of New Chat container
        const newChatOpacity = window.getComputedStyle(refNewChat.current).opacity;

        // New Chat opacity change setup
        if (newChatOpacity < 0.5) {
            refNewChat.current.style.opacity = 1;

            refFolderChat.current.style.opacity = 1;

            refChats.current.style.opacity = 1;
        }
        else {
            refNewChat.current.style.opacity = 0;

            refFolderChat.current.style.opacity = 0;

            refChats.current.style.opacity = 0;
        }

        // Mainarea width change
        refMainarea.current.style.marginLeft = "90px";

        setLeftSideToggleClicked(false);

        setTimeout(() => {
            if (refSidebar.current?.matches(":hover")) {
                setSidebarHover(true);
            }
        }, 300);

    };

    const handleMouseEnter = () => {
        const sidebarWidth = refSidebar.current.getBoundingClientRect().width;

        if (sidebarWidth == 90 && leftSideToggleClicked == false) {
            setSidebarHover(true);
        }
    };

    const handleMouseLeave = () => {
        setSidebarHover(false);
        setLeftSideToggleClicked(false);
    };

    const CreateFolder = () => {
        setFolderPopup(!folderPopup);
    };

    // Calculate folder window Height
    useEffect(() => {

        const fetchData = async () => {
            // Get User Folders
            try {
                const res = await api.get("/user/folders");
                
                console.log("Folder Data: ", res.data);
                
            } catch (error) {
                console.error("Error fetching info:", error.response?.data || error.message);
                return null;
            }

            if (showFolders) {
                const fullHeightFolders = `${refFoldersWindow.current.scrollHeight}px`;
                setFoldersWindowHeight(fullHeightFolders);

                // Remove the "auto" switch — let it stay at pixel value
            } else {
                // From current height → 0px
                const fullHeightFolders = `${refFoldersWindow.current.scrollHeight}px`;
                setFoldersWindowHeight(fullHeightFolders);
                requestAnimationFrame(() => {
                    setFoldersWindowHeight("0px");
                });
            }
        };
        fetchData();

    }, [showFolders]);

    const ExpandFolderList = () => {
        setShowFolders(!showFolders);

        refFoldersExpandBtn.current.style.transform = showFolders ? "rotate(-90deg)" : "rotate(0deg)";
    };

    // Calculate Chats window Height
    useEffect(() => {
        if (showChats) {
            const fullHeightChats = `${refChatsWindow.current.scrollHeight}px`;
            setChatWindowHeight(fullHeightChats);

            // Remove the "auto" switch — let it stay at pixel value
        } else {
            // From current height → 0px
            const fullHeightChats = `${refChatsWindow.current.scrollHeight}px`;
            setChatWindowHeight(fullHeightChats);
            requestAnimationFrame(() => {
                setChatWindowHeight("0px");
            });
        }
    }, [showChats]);

    const ExpandChatList = () => {
        setShowChats(!showChats);

        refChatsExpandBtn.current.style.transform = showChats ? "rotate(-90deg)" : "rotate(0deg)";
    };

    // On Load
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const userStatus = await axios.post("http://localhost:5000/api/auth/currentUser", {}, { withCredentials: true });

                if (userStatus.status == 200) {
                    // No AccessToken - Get New
                    if (!accessToken) {
                        const res = await axios.post("http://localhost:5000/api/auth/refresh", {}, { withCredentials: true });
                        const newAccessToken = res.data.accessToken;

                        setAccessToken(newAccessToken);
                    }

                    // Get User Info
                    try {
                        const res = await api.get("/user/me");
                        return setUsername(res.data.username);
                    } catch (error) {
                        console.error("Error fetching info:", error.response?.data || error.message);
                        return null;
                    }
                }

            } catch (error) {
                console.error("Error occurred:", error.response?.data || error.message);
            }
        };

        fetchInfo();
    }, [accessToken]);

    // On Logout
    const handleLogOut = async () => {

        await axios.post("http://localhost:5000/api/auth/logout", {}, { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true });

        setAccessToken(null);
        setUser(null);

        navigate("/loginSignUp");
    };

    return (
        <>
            <div className="flex h-screen w-screen bg-black bg-[radial-gradient(circle_400px_at_0%_100%,rgba(20,80,200,0.2)_0%,rgba(50,120,220,0.1)_60%,rgba(20,80,200,0)_100%),radial-gradient(circle_400px_at_100%_0%,rgba(20,80,200,0.2)_0%,rgba(50,120,220,0.1)_60%,rgba(20,80,200,0)_100%)]">

                {/* Sidebar */}
                <div className="absolute top-0 left-0">
                    <div className="flex flex-col h-screen w-[90px] items-center px-4 py-5 gap-3 bg-transparent text-white overflow-hidden whitespace-nowrap transition-[width] duration-300 ease-in-out"
                        ref={refSidebar}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >

                        <div className="flex flex-col item-center h-full w-full rounded-xl bg-[#161616] p-2 gap-1">

                            {/* LOGO - Sidebar Toggle Btn */}
                            <div className="flex items-center justify-between h-[55px] w-full rounded-xl bg-[#161616] pb-4 gap-2 overflow-hidden">

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
                                    <div className="flex items-center rounded-xl p-1 hover:bg-[#0a0a0a]">
                                        <img src="https://img.icons8.com/?size=100&id=v3QqTdoWcQln&format=png&color=5A5A5A" alt="right sidebar" className="invert rounded-full w-[25px] h-[auto]" onClick={RightSideToggle} />
                                    </div>
                                }
                            </div>

                            {/* New Chat Btn */}
                            <div className="flex w-full mb-1">
                                <div className="flex item-center gap-2 h-[40px] w-full rounded-lg bg-[#155dfc] p-2 text-white overflow-hidden whitespace-nowrap">
                                    <div className="flex items-center flex-shrink-0">
                                        <img src="https://img.icons8.com/?size=100&id=zqRKVWtC1VeY&format=png&color=ffffff" alt="Logo" className="rounded-full w-[24px] h-auto" />
                                    </div>
                                    <div className="opacity-0 transition-all duration-300 ease-in-out" ref={refNewChat}>New Chat</div>
                                </div>
                            </div>

                            {/* Sidebar Main Content (Search, Folder, Folders List, Chat) */}
                            <div className="opacity-0 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap" ref={refFolderChat}>

                                {/* Search Bar */}
                                <div className="flex item-center w-full rounded-lg bg-[#2d2d2d] p-2">
                                    <input type="text" placeholder="Search" className="w-full outline-0" />
                                </div>

                                {/* Folder */}
                                <div className="flex item-center justify-between w-full rounded-xl bg-[#161616] py-2 text-sm mt-[10px]">
                                    <div>Folders</div>
                                    <div className="flex item-center justify-center gap-1">
                                        <button className="h-[20px] rounded-md bg-[#2d2d2d] px-1 flex-shrink-0" onClick={CreateFolder}>
                                            <img src="https://img.icons8.com/?size=100&id=37784&format=png&color=000000" alt="expand-folders" className="invert w-[10px] h-auto" />
                                        </button>
                                        <button className="h-[20px] rounded-md bg-[#2d2d2d] px-1" onClick={ExpandFolderList}>
                                            <img src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A" alt="expand-folders" className="invert w-[10px] h-auto transition-all duration-300" ref={refFoldersExpandBtn} />
                                        </button>
                                    </div>
                                </div>

                                {/* Folders List*/}
                                <div className={`flex flex-col gap-1 w-full rounded-lg  overflow-hidden transition-all duration-300 ease-in-out ${showFolders ? "opacity-100" : "opacity-20"}`} ref={refFoldersWindow} style={{ height: foldersWindowHeight }}>

                                    <div className="bg-blue-500 rounded-lg">
                                        <div className="flex item-center justify-between ml-[5px] rounded-r-lg bg-[#2d2d2d] p-2">
                                            <div className="flex gap-2">
                                                <div className="flex items-center">
                                                    <img src="https://img.icons8.com/?size=100&id=82790&format=png&color=ffffff" alt="Folder" className="w-[20px] h-auto flex-shrink-0" />
                                                </div>
                                                <div>Work chats</div>
                                            </div>
                                            <div className="flex items-center">
                                                <img src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd" alt="options" className="w-[14px] h-auto flex-shrink-0" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-pink-500 rounded-lg ">
                                        <div className="flex item-center justify-between ml-[5px] rounded-r-lg bg-[#2d2d2d] p-2">
                                            <div className="flex gap-2">
                                                <div className="flex items-center">
                                                    <img src="https://img.icons8.com/?size=100&id=82790&format=png&color=ffffff" alt="Folder" className="w-[20px] h-auto flex-shrink-0" />
                                                </div>
                                                <div>Project chats</div>
                                            </div>
                                            <div className="flex items-center">
                                                <img src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd" alt="options" className="w-[14px] h-auto flex-shrink-0" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-500 rounded-lg ">
                                        <div className="flex item-center justify-between ml-[5px] rounded-r-lg bg-[#2d2d2d] p-2">
                                            <div className="flex gap-2">
                                                <div className="flex items-center">
                                                    <img src="https://img.icons8.com/?size=100&id=82790&format=png&color=ffffff" alt="Folder" className="w-[20px] h-auto flex-shrink-0" />
                                                </div>
                                                <div>Life chats</div>
                                            </div>
                                            <div className="flex items-center">
                                                <img src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd" alt="options" className="w-[14px] h-auto flex-shrink-0" />
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Chats */}
                                <div className={`flex item-center justify-between w-full rounded-xl bg-[#161616] py-2 text-sm ${showFolders ? "mt-[10px]" : "mt-[0px]"}`}>
                                    <div>Chats</div>
                                    <div className="flex item-center justify-center gap-1">
                                        <button className="h-[20px] rounded-md bg-[#2d2d2d] px-1" onClick={ExpandChatList}>
                                            <img src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A" alt="expand-folders" className="invert w-[10px] h-auto transition-all duration-300" ref={refChatsExpandBtn} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Chats List */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showChats ? "opacity-100" : "opacity-20"}`} ref={refChatsWindow} style={{ height: chatsWindowHeight }}>

                                <div className="opacity-0 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap" ref={refChats}>
                                    <div className="flex flex-col gap-1 item-center w-full rounded-lg">

                                        <div className="flex flex-col item-center justify-between w-full rounded-lg bg-[#2d2d2d] p-2 gap-1">
                                            <div className="flex justify-between gap-2">
                                                <div className="flex gap-2">
                                                    {/* <div className="flex items-center">
                                                        <img src="https://img.icons8.com/?size=100&id=87085&format=png&color=ffffff" alt="chat" className="w-[20px] h-auto" />
                                                    </div> */}
                                                    <div>Trip plan</div>
                                                </div>

                                                <div className="flex items-center">
                                                    <img src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd" alt="options" className="w-[14px] h-auto" />
                                                </div>
                                            </div>
                                            <div className="text-[12px] truncate">A 3-day trip to see the northern lights in norway</div>
                                        </div>

                                        <div className="flex flex-col item-center justify-between w-full rounded-lg bg-[#2d2d2d] p-2 gap-1">
                                            <div className="flex justify-between gap-2">
                                                <div className="flex gap-2">
                                                    {/* <div className="flex items-center">
                                                        <img src="https://img.icons8.com/?size=100&id=87085&format=png&color=ffffff" alt="chat" className="w-[20px] h-auto" />
                                                    </div> */}
                                                    <div>Projects Ideas</div>
                                                </div>

                                                <div className="flex items-center">
                                                    <img src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd" alt="options" className="w-[14px] h-auto" />
                                                </div>
                                            </div>
                                            <div className="text-[12px] truncate">A 3-day trip to see the northern lights in norway</div>
                                        </div>

                                        <div className="flex flex-col item-center justify-between w-full rounded-lg bg-[#2d2d2d] p-2 gap-1">
                                            <div className="flex justify-between gap-2">
                                                <div className="flex gap-2">
                                                    {/* <div className="flex items-center">
                                                        <img src="https://img.icons8.com/?size=100&id=87085&format=png&color=ffffff" alt="chat" className="w-[20px] h-auto" />
                                                    </div> */}
                                                    <div>Learn python</div>
                                                </div>

                                                <div className="flex items-center">
                                                    <img src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd" alt="options" className="w-[14px] h-auto" />
                                                </div>
                                            </div>
                                            <div className="text-[12px] truncate">A 3-day trip to see the northern lights in norway</div>
                                        </div>

                                        <div className="flex flex-col item-center justify-between w-full rounded-lg bg-[#2d2d2d] p-2 gap-1">
                                            <div className="flex justify-between gap-2">
                                                <div className="flex gap-2">
                                                    {/* <div className="flex items-center">
                                                        <img src="https://img.icons8.com/?size=100&id=87085&format=png&color=ffffff" alt="chat" className="w-[20px] h-auto" />
                                                    </div> */}
                                                    <div>Learn Tailwind</div>
                                                </div>

                                                <div className="flex items-center">
                                                    <img src="https://img.icons8.com/?size=100&id=102729&format=png&color=dddddd" alt="options" className="w-[14px] h-auto" />
                                                </div>
                                            </div>
                                            <div className="text-[12px] truncate">A 3-day trip to see the northern lights in norway</div>
                                        </div>

                                    </div>
                                </div>

                            </div>

                            {/* Chats Bottom Line */}
                            <div className="h-1 w-full"></div>

                            {/* User Info Part */}
                            <div className={`absolute flex items-center left-[16px] bottom-5 h-14 rounded-b-lg border-t-1 border-[#2a2a2a] gap-2 bg-[#161616] transition-all duration-300 overflow-hidden whitespace-nowrap ${toggleSidebar ? "w-[268px]" : "w-[58px]"}`}>

                                <div className="flex items-center justify-center h-[40px] w-[40px]  rounded-full m-2 bg-[#323232] flex-shrink-0" onClick={handleLogOut}>
                                    <img src="https://img.icons8.com/?size=100&id=98957&format=png&color=ffffff" alt="Profile" className="h-[30px] w-[30px]" />
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
                <div className="flex flex-col items-center h-screen flex-1 ml-[90px] bg-transparent transition-[margin-left] duration-300 ease-in-out" ref={refMainarea}>

                    {/* TitleBar */}
                    <div className="flex w-full justify-between text-white pt-8 pr-8">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center">
                                {/* <button className="h-[20px]">
                  <img src="https://img.icons8.com/?size=100&id=40217&format=png&color=1A1A1A" alt="expand-folders" className="invert w-[14px] h-auto" />
                </button> */}
                            </div>
                            <div className="text-[20px]">Sage</div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="h-[20px]">
                                <img src="https://img.icons8.com/?size=100&id=bc20TOtEmtiP&format=png&color=000000" alt="expand-folders" className="invert w-[20px] h-auto" />
                            </button>

                            <button className="h-[20px]">
                                <img src="https://img.icons8.com/?size=100&id=g1EQCit0RQ7Z&format=png&color=1A1A1A" alt="expand-folders" className="invert w-[18px] h-auto" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex w-full h-full items-center justify-center pr-6">

                        <div className="flex h-min-[500px] rounded-2xl bg-[#161616]">

                            <div className="flex flex-col items-center justify-center w-full p-4 gap-5">

                                <div className="flex flex-col items-center gap-2 max-w-[351px] text-center mt-[10px]">

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

                                <div className="flex flex-col gap-2 w-full mt-[12px]">

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

                                        <input type="text" placeholder="Ask Anything" className="h-[40px] w-full indent-8 outline-0" />

                                        <div className="absolute top-[10px] right-[40px]">
                                            <img src="https://img.icons8.com/?size=100&id=jkqQE2I90I8R&format=png&color=1A1A1A" alt="Logo" className="rounded-full w-[18px] h-auto" />
                                        </div>

                                        <div className="absolute top-[4px] right-[4px] bg-blue-600 p-1 rounded-lg">
                                            <img src="https://img.icons8.com/?size=100&id=7789&format=png&color=1A1A1A" alt="Logo" className="invert rounded-full w-[24px] h-auto" />
                                        </div>

                                    </div>

                                </div>
                            </div>

                        </div>

                    </div>

                </div>

                {/* Popup window */}
                {folderPopup &&
                    <>
                        {/* {Overlay} */}
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-[40]" onClick={() => setFolderPopup(!folderPopup)}></div>

                        {/* {Popup} */}
                        <div className="fixed top-1/2 left-1/2 h-auto w-[400px] z-50 bg-[#282828] rounded-2xl shadow-gray-500 flex flex-col transform -translate-x-1/2 -translate-y-1/2 text-white">
                            <div className="relative flex flex-col gap-5 px-10 py-10">

                                <div className="absolute right-3 top-3 flex items-center rounded-full p-2 hover:bg-[#1c1c1c]">
                                    <button onClick={() => setFolderPopup(!folderPopup)}>
                                        <img src="https://img.icons8.com/?size=100&id=46&format=png&color=ffffff" alt="Cross" className="h-auto w-[14px]" />
                                    </button>
                                </div>

                                <div className="flex justify-center w-full text-[20px]">New Folder</div>
                                <div className="flex gap-2">
                                    <label htmlFor="adad">Name -</label>
                                    <input type="text" className="w-[250px] border-b-1 border-white outline-0 text-white indent-1" />
                                </div>
                                <div className="flex gap-3">

                                    <label htmlFor="adad">Color -</label>
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="c-1" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c-1" className="relative appearance-none w-4 h-4 bg-red-500 rounded-sm checked:bg-red-800 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-2" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c-2" className="appearance-none w-4 h-4 bg-blue-500 rounded-sm checked:bg-blue-800 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-3" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c3-" className="appearance-none w-4 h-4 bg-green-500 rounded-sm checked:bg-green-800 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-4" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c-4" className="appearance-none w-4 h-4 bg-yellow-500 rounded-sm checked:bg-yellow-800 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-5" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c-5" className="appearance-none w-4 h-4 bg-orange-500 rounded-sm checked:bg-orange-800 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-6" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c-6" className="appearance-none w-4 h-4 bg-pink-500 rounded-sm checked:bg-pink-800 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-7" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c-7" className="appearance-none w-4 h-4 bg-purple-500 rounded-sm checked:bg-purple-800 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-8" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c8-" className="appearance-none w-4 h-4 bg-gray-200 rounded-sm checked:bg-gray-500 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-9" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c-9" className="appearance-none w-4 h-4 bg-gray-500 rounded-sm checked:bg-gray-700 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-10" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c-10" className="appearance-none w-4 h-4 bg-violet-500 rounded-sm checked:bg-violet-800 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                        <label htmlFor="c-11" className="relative inline-flex items-center cursor-pointer">
                                            <input type="radio" name="color" id="c-11" className="appearance-none w-4 h-4 bg-cyan-500 rounded-sm checked:bg-cyan-800 checked:border-transparent focus:outline-none peer" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden peer-checked:block">
                                                <img src="https://img.icons8.com/?size=100&id=e0QmzRlv9YWo&format=png&color=ffffff" alt="radio" className="h-auto w-[8px]" />
                                            </div>
                                        </label>

                                    </div>
                                </div>
                                <div className="flex justify-center w-full ">
                                    <button className="px-2 py-[1px] mt-[10px] rounded-lg bg-[#155dfc] text-[18px]">Create</button>
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