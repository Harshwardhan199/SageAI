import ChatItem from "./ChatItem";

const ChatSection = ({
  chats,
  folders,

  showFolders,
  showChats,
  chatsWindowHeight,

  chatMenuId,

  refChatsExpandBtn,

  ToggleChatList,

  toggleChatMenu,

  OpenChat,

  handleChatDelete,
  handleMoveChat,
  handleChatRename,
}) => {
  return (
    <>
      {/* Chats Header */}
      {chats.length > 0 && (
        <div
          className={`flex items-center justify-between w-full rounded-xl bg-transparent py-2 text-sm text-primary font-bold transition-all duration-100 ease-in-out ${
            showFolders ? "mt-[10px]" : "mt-[0px]"
          }`}
        >
          <div>Chats</div>

          <div className="flex items-center justify-center gap-1">
            <button
              className="h-[20px] rounded-md bg-card-bg border border-default hover:bg-hover-bg px-1 cursor-pointer"
              onClick={ToggleChatList}
            >
              <img
                src="https://img.icons8.com/?size=100&id=R52ioYgkCvz6&format=png&color=1A1A1A"
                alt="Expand Chats"
                className="theme-icon-dark w-[10px] h-auto transition-all duration-300"
                ref={refChatsExpandBtn}
              />
            </button>
          </div>
        </div>
      )}

      {/* Chat List */}
      <div
        className={`overflow-visible transition-all duration-200 ease-in-out ${
          showChats ? "opacity-100" : "opacity-0"
        }`}
        style={{ height: chatsWindowHeight }}
      >
        <div className="flex flex-col gap-1 item-center w-full transition-all duration-300 ease-in-out overflow-visible whitespace-nowrap">
          {chats.map((chat) => (
            <ChatItem
              key={chat._id}
              chat={chat}
              folders={folders}
              currentFolder={null}
              chatMenuId={chatMenuId}
              toggleChatMenu={toggleChatMenu}
              OpenChat={OpenChat}
              handleChatDelete={handleChatDelete}
              handleMoveChat={handleMoveChat}
              handleChatRename={handleChatRename}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default ChatSection;
