import { useSelector } from "react-redux";
import { ChatState } from "../../../types/types";
import { useEffect, useState } from "react";

const ChatHeader = () => {
  const { conversations, selectedChat } = useSelector(
    (state: ChatState) => state.chat
  );
  const [headerProps, setHeaderProps] = useState({});

  useEffect(() => {
    if (conversations?.length > 0) {
      const filteredChat = conversations.find((c) => c.id === selectedChat);
      setHeaderProps(filteredChat);
    } else {
      setHeaderProps({});
    }
  }, [selectedChat, conversations]);

  if (!headerProps) return null; // Render nothing if no chat is selected
  return (
    <>
      <div className="p-4 border-b border-gray-200 bg-white flex items-center">
        <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center">
          <span className="text-indigo-700 font-semibold">
            {headerProps?.name?.charAt(0)}
            {/* A{headerProps?.name} */}
          </span>
        </div>
        <div className="ml-3">
          <h2 className="font-semibold text-gray-800">
            {headerProps?.name}
            {/* Name */}
          </h2>
          <p
            className={`text-xs ${
              headerProps?.isOnline ? "text-green-500" : "text-red-500"
            } flex items-center`}
          >
            <span
              className={`w-2 h-2 ${
                headerProps?.isOnline ? "bg-green-500" : "bg-red-500"
              } rounded-full mr-1`}
            ></span>
            {headerProps?.isOnline ? "Online" : "Offline"}
            {/* Online */}
          </p>
          <p className={`text-xs flex items-center `}>
            {headerProps?.lastSeen}
            {/* LastSeen */}
          </p>
        </div>
      </div>
    </>
  );
};

export default ChatHeader;
