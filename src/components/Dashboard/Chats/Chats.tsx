import { useSelector } from "react-redux";

import ChatList from "./ChatList";
import { useState } from "react";

import ChatHeader from "./ChatHeader";
import { MessageSquare, Send } from "lucide-react";
import { ChatState } from "../../../types/types";

const Chats = () => {
  const [message, setMessage] = useState("");
  const { selectedChat, conversations } = useSelector(
    (state: ChatState) => state.chat
  );

  const messages = [
    {
      id: 1,
      sender: "Alice Smith",
      content: "Hey there!",
      time: "10:25 AM",
      isMine: false,
    },
    {
      id: 2,
      sender: "You",
      content: "Hi Alice! How are you?",
      time: "10:28 AM",
      isMine: true,
    },
    {
      id: 3,
      sender: "Alice Smith",
      content: "I'm good, thanks! How about you?",
      time: "10:30 AM",
      isMine: false,
    },
    {
      id: 4,
      sender: "Alice Smith",
      content: "Hey there!",
      time: "10:25 AM",
      isMine: false,
    },
    {
      id: 5,
      sender: "You",
      content: "Hi Alice! How are you?",
      time: "10:28 AM",
      isMine: true,
    },
    {
      id: 6,
      sender: "Alice Smith",
      content: "I'm good, thanks! How about you?",
      time: "10:30 AM",
      isMine: false,
    },
    {
      id: 7,
      sender: "Alice Smith",
      content: "Hey there!",
      time: "10:25 AM",
      isMine: false,
    },
    {
      id: 8,
      sender: "You",
      content: "Hi Alice! How are you?",
      time: "10:28 AM",
      isMine: true,
    },
    {
      id: 9,
      sender: "Alice Smith",
      content: "I'm good, thanks! How about you?",
      time: "10:30 AM",
      isMine: false,
    },
    {
      id: 10,
      sender: "Alice Smith",
      content: "Hey there!",
      time: "10:25 AM",
      isMine: false,
    },
    {
      id: 11,
      sender: "You",
      content: "Hi Alice! How are you?",
      time: "10:28 AM",
      isMine: true,
    },
    {
      id: 12,
      sender: "Alice Smith",
      content: "I'm good, thanks! How about you?",
      time: "10:30 AM",
      isMine: false,
    },
    {
      id: 13,
      sender: "Alice Smith",
      content: "Hey there!",
      time: "10:25 AM",
      isMine: false,
    },
    {
      id: 14,
      sender: "You",
      content: "Hi Alice! How are you?",
      time: "10:28 AM",
      isMine: true,
    },
    {
      id: 15,
      sender: "Alice Smith",
      content: "I'm good, thanks! How about you?",
      time: "10:30 AM",
      isMine: false,
    },
    {
      id: 16,
      sender: "Alice Smith",
      content: "Hey there!",
      time: "10:25 AM",
      isMine: false,
    },
    {
      id: 17,
      sender: "You",
      content: "Hi Alice! How are you?",
      time: "10:28 AM",
      isMine: true,
    },
    {
      id: 18,
      sender: "Alice Smith",
      content: "I'm good, thanks! How about you?",
      time: "10:30 AM",
      isMine: false,
    },
    {
      id: 19,
      sender: "Alice Smith",
      content: "Hey there!",
      time: "10:25 AM",
      isMine: false,
    },
    {
      id: 20,
      sender: "You",
      content: "Hi Alice! How are you?",
      time: "10:28 AM",
      isMine: true,
    },
    {
      id: 21,
      sender: "Alice Smith",
      content: "I'm good, thanks! How about you?",
      time: "10:30 AM",
      isMine: false,
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return (
    <>
      {/* Chat List */}
      <div className="w-80 bg-white border-r border-gray-200">
        <ChatList chats={conversations} />
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <ChatHeader chats={conversations} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isMine
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      {!msg.isMine && (
                        <div className="font-semibold text-sm">
                          {msg.sender}
                        </div>
                      )}
                      <div>{msg.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          msg.isMine ? "text-indigo-200" : "text-gray-500"
                        }`}
                      >
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center">
                <textarea
                  className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Type a message..."
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  className="ml-2 p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none"
                  onClick={handleSendMessage}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-gray-400" />
              <h2 className="mt-2 text-xl font-semibold text-gray-700">
                Select a conversation
              </h2>
              <p className="mt-1 text-gray-500">
                Choose from your existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Chats;
