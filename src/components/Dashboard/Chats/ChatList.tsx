import { Hash, Plus, Search, UserPlus, Users, X } from "lucide-react";
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
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState("direct"); // 'direct' or 'group'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<HandleUserSelectUser[]>(
    []
  );
  const [groupName, setGroupName] = useState("");
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

  const availableUsers = [
    {
      id: 4,
      name: "Carol Davis",
      email: "carol@example.com",
      avatar: "C",
      online: true,
    },
    {
      id: 5,
      name: "David Wilson",
      email: "david@example.com",
      avatar: "D",
      online: false,
    },
    {
      id: 6,
      name: "Emma Brown",
      email: "emma@example.com",
      avatar: "E",
      online: true,
    },
    {
      id: 7,
      name: "Frank Miller",
      email: "frank@example.com",
      avatar: "F",
      online: true,
    },
    {
      id: 8,
      name: "Grace Lee",
      email: "grace@example.com",
      avatar: "G",
      online: false,
    },
  ];

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  interface HandleUserSelectUser {
    id: number;
    name: string;
    email: string;
    avatar: string;
    online: boolean;
  }

  const handleUserSelect = (user: HandleUserSelectUser): void => {
    if (newChatType === "direct") {
      // For direct chat, immediately create conversation
      createDirectChat(user);
    } else {
      // For group chat, add to selected users
      if (!selectedUsers.find((u: HandleUserSelectUser) => u.id === user.id)) {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  interface User {
    id: number;
    name: string;
    email: string;
    avatar: string;
    online: boolean;
  }

  const removeSelectedUser = (userId: number): void => {
    setSelectedUsers(selectedUsers.filter((u: User) => u.id !== userId));
  };

  const createDirectChat = (user: HandleUserSelectUser): void => {
    console.log("Creating direct chat with:", user);
    // Here you would make an API call to create the conversation
    // For now, we'll just close the modal and simulate success
    setShowNewChatModal(false);
    resetNewChatState();
    // You could add the new chat to the chats list here
  };

  const createGroupChat = () => {
    if (selectedUsers.length < 2) {
      alert("Please select at least 2 users for a group chat");
      return;
    }
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    console.log("Creating group chat:", {
      name: groupName,
      participants: selectedUsers,
    });

    // Here you would make an API call to create the group conversation
    setShowNewChatModal(false);
    resetNewChatState();
  };

  const resetNewChatState = () => {
    setNewChatType("direct");
    setSearchQuery("");
    setSelectedUsers([]);
    setGroupName("");
  };

  const handleCloseModal = () => {
    setShowNewChatModal(false);
    resetNewChatState();
  };

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <button
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
            onClick={() => setShowNewChatModal(true)}
          >
            <Plus size={20} />
          </button>
        </div>
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
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Start New Chat
                </h2>
                <button
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={handleCloseModal}
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Chat Type Selector */}
              <div className="mt-4 flex space-x-2">
                <button
                  className={`flex-1 p-2 rounded-lg border transition-colors ${
                    newChatType === "direct"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setNewChatType("direct")}
                >
                  <UserPlus size={16} className="inline mr-2" />
                  Direct Chat
                </button>
                <button
                  className={`flex-1 p-2 rounded-lg border transition-colors ${
                    newChatType === "group"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setNewChatType("group")}
                >
                  <Hash size={16} className="inline mr-2" />
                  Group Chat
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Group Name Input (only for group chats) */}
              {newChatType === "group" && (
                <div className="p-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter group name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
              )}

              {/* Selected Users (for group chats) */}
              {newChatType === "group" && selectedUsers.length > 0 && (
                <div className="p-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Users ({selectedUsers.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm"
                      >
                        <span className="mr-1">{user.name}</span>
                        <button
                          className="hover:bg-indigo-200 rounded-full p-0.5"
                          onClick={() => removeSelectedUser(user.id)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Input */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  <div className="p-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedUsers.find((u) => u.id === user.id)
                            ? "bg-indigo-50"
                            : ""
                        }`}
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center">
                              <span className="text-indigo-700 font-semibold">
                                {user.avatar}
                              </span>
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                user.online ? "bg-green-500" : "bg-gray-400"
                              }`}
                            ></div>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="font-medium text-gray-800">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                          {selectedUsers.find((u) => u.id === user.id) &&
                            newChatType === "group" && (
                              <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No users found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (for group chats) */}
            {newChatType === "group" && (
              <div className="p-4 border-t border-gray-200">
                <button
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={createGroupChat}
                  disabled={selectedUsers.length < 2 || !groupName.trim()}
                >
                  Create Group Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatList;
