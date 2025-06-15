import { Users } from "lucide-react";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppStateType } from "../../../types/appTypes";
import { selectChatAction } from "../../../redux/dashboardReducer";
import "./chatList.css";

interface Chat {
  id: number;
  name: string;
  time: string;
  lastMessage: string;
  unread: number;
  isGroup: boolean;
}

interface ChatListProps {
  chats: Chat[];
}

const ChatList: React.FC<ChatListProps> = ({ chats }) => {
  const { selectedChat } = useSelector(
    (state: AppStateType) => state.DashboardStates
  );
  const dispatch = useDispatch();

  // const [showDelete, setShowDelete] = useState(false);
  const startX = useRef<number | null>(null);
  const [swipedId, setSwipedId] = useState<number | null>(null);

  // const [swiped, setSwiped] = useState(false);
  const startXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent, id: number) => {
    const endX = e.changedTouches[0].clientX;
    if (startX.current !== null && startX.current - endX > 50) {
      setSwipedId(id);
    } else {
      setSwipedId(null);
    }
  };

  const handleDelete = (id: number) => {
    console.log("Delete chat id:", id);
    // your delete logic
  };
  // Mouse Events
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent, id: number) => {
    const endX = e.clientX;
    if (startXRef.current !== null && startXRef.current - endX > 50) {
      setSwipedId(id);
    } else {
      setSwipedId(null);
    }
    startXRef.current = null;
  };

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
        <div className="mt-2">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full p-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
              selectedChat === chat.id ? "bg-indigo-50" : ""
            }`}
            onClick={() => dispatch(selectChatAction(chat.id))}
          >
            <div
              className={`chat-item ${
                swipedId === chat.id ? "swiped" : ""
              } flex items-center`}
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(e, chat.id)}
              onMouseDown={handleMouseDown}
              onMouseUp={(e) => handleMouseUp(e, chat.id)}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center">
                  <span className="text-indigo-700 font-semibold">
                    {chat.name.charAt(0)}
                  </span>
                </div>
                {chat.isGroup && (
                  <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-1">
                    <Users size={10} className="text-white" />
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-gray-800">{chat.name}</h2>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage}
                </p>
              </div>
              {chat.unread > 0 && (
                <div className="ml-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {chat.unread}
                </div>
              )}
              <button
                className="delete-btn"
                onClick={() => handleDelete(chat.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ChatList;
