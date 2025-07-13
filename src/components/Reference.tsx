import React, { useState } from "react";
import {
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Send,
  Plus,
  Search,
  X,
  UserPlus,
  Hash,
  Edit3,
  Bell,
  Shield,
  Palette,
  Globe,
  Moon,
  Sun,
  //   Volume2,
  //   VolumeX,
  //   UserCheck,
  //   UserX,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  //   MapPin,
  //   Check,
  //   AlertCircle,
  Trash2,
  Archive,
  Blocks as Block,
  //   Flag,
} from "lucide-react";

function Reference() {
  const [activeTab, setActiveTab] = useState("chats");
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState("direct");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  //   const [showContactModal, setShowContactModal] = useState(false);
  const [settingsSection, setSettingsSection] = useState("profile");
  //   const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mock data
  const chats = [
    {
      id: 1,
      name: "Alice Smith",
      lastMessage: "Hey, how are you?",
      time: "10:30 AM",
      unread: 2,
    },
    {
      id: 2,
      name: "Bob Johnson",
      lastMessage: "Can we meet tomorrow?",
      time: "Yesterday",
      unread: 0,
    },
    {
      id: 3,
      name: "Team Alpha",
      lastMessage: "Carol: Let's discuss the project",
      time: "Yesterday",
      unread: 5,
      isGroup: true,
    },
  ];

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

  const contacts = [
    {
      id: 1,
      name: "Alice Smith",
      email: "alice@example.com",
      phone: "+1 (555) 123-4567",
      avatar: "A",
      online: true,
      lastSeen: "2 minutes ago",
      status: "Working on new project",
      joinedDate: "2023-06-15",
      mutualGroups: ["Team Alpha", "Project Beta"],
      blocked: false,
    },
    {
      id: 2,
      name: "Bob Johnson",
      email: "bob@example.com",
      phone: "+1 (555) 987-6543",
      avatar: "B",
      online: false,
      lastSeen: "1 hour ago",
      status: "Available for meetings",
      joinedDate: "2023-05-20",
      mutualGroups: ["Team Alpha"],
      blocked: false,
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol@example.com",
      phone: "+1 (555) 456-7890",
      avatar: "C",
      online: true,
      lastSeen: "Just now",
      status: "In a meeting",
      joinedDate: "2023-07-10",
      mutualGroups: ["Team Alpha", "Design Team"],
      blocked: false,
    },
  ];

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
  ];

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactSearchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUserSelect = (user) => {
    if (newChatType === "direct") {
      createDirectChat(user);
    } else {
      if (!selectedUsers.find((u) => u.id === user.id)) {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const createDirectChat = (user) => {
    console.log("Creating direct chat with:", user);
    setShowNewChatModal(false);
    resetNewChatState();
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

  const handleContactAction = (action, contactId) => {
    console.log(`${action} contact:`, contactId);
    // Implement contact actions (block, delete, etc.)
  };

  const renderChatList = () => (
    <div className="w-80 bg-white border-r border-gray-200">
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
            className="w-full p-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-80px)]">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedChat === chat.id
                ? "bg-indigo-50 border-l-4 border-l-indigo-600"
                : ""
            }`}
            onClick={() => setSelectedChat(chat.id)}
          >
            <div className="flex items-center">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContactsList = () => (
    <div className="w-80 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-800">Contacts</h1>
          <button
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
            onClick={() => setShowNewChatModal(true)}
          >
            <UserPlus size={20} />
          </button>
        </div>
        <div className="mt-2 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={contactSearchQuery}
            onChange={(e) => setContactSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-80px)]">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedContact === contact.id
                ? "bg-indigo-50 border-l-4 border-l-indigo-600"
                : ""
            }`}
            onClick={() => setSelectedContact(contact.id)}
          >
            <div className="flex items-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center">
                  <span className="text-indigo-700 font-semibold">
                    {contact.avatar}
                  </span>
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    contact.online ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-gray-800">
                    {contact.name}
                  </h2>
                  <button
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Show contact options menu
                    }}
                  >
                    <MoreVertical size={16} className="text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{contact.status}</p>
                <p className="text-xs text-gray-500">
                  {contact.online ? "Online" : contact.lastSeen}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettingsList = () => (
    <div className="w-80 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-80px)]">
        <div className="p-2">
          {[
            { id: "profile", label: "Profile", icon: Edit3 },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "privacy", label: "Privacy & Security", icon: Shield },
            { id: "appearance", label: "Appearance", icon: Palette },
            { id: "language", label: "Language & Region", icon: Globe },
          ].map((setting) => (
            <button
              key={setting.id}
              className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors flex items-center ${
                settingsSection === setting.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700"
              }`}
              onClick={() => setSettingsSection(setting.id)}
            >
              <setting.icon size={20} className="mr-3" />
              {setting.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContactDetails = () => {
    const contact = contacts.find((c) => c.id === selectedContact);
    if (!contact) return null;

    return (
      <div className="flex-1 bg-gray-50">
        <div className="p-6">
          {/* Contact Header */}
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-200 flex items-center justify-center">
                  <span className="text-indigo-700 font-bold text-2xl">
                    {contact.avatar}
                  </span>
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${
                    contact.online ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
              </div>
              <div className="ml-6 flex-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  {contact.name}
                </h2>
                <p className="text-gray-600">{contact.status}</p>
                <p className="text-sm text-gray-500">
                  {contact.online ? "Online" : `Last seen ${contact.lastSeen}`}
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">
                  <MessageSquare size={20} />
                </button>
                <button className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors">
                  <Phone size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail size={16} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-800">{contact.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-800">{contact.phone}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="text-gray-800">
                    {new Date(contact.joinedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mutual Groups */}
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Mutual Groups
            </h3>
            <div className="space-y-2">
              {contact.mutualGroups.map((group, index) => (
                <div
                  key={index}
                  className="flex items-center p-2 bg-gray-50 rounded-lg"
                >
                  <Hash size={16} className="text-gray-500 mr-2" />
                  <span className="text-gray-700">{group}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Actions
            </h3>
            <div className="space-y-2">
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center text-gray-700"
                onClick={() => handleContactAction("archive", contact.id)}
              >
                <Archive size={16} className="mr-3" />
                Archive Conversation
              </button>
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center text-gray-700"
                onClick={() => handleContactAction("block", contact.id)}
              >
                <Block size={16} className="mr-3" />
                Block Contact
              </button>
              <button
                className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center text-red-600"
                onClick={() => handleContactAction("delete", contact.id)}
              >
                <Trash2 size={16} className="mr-3" />
                Delete Contact
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsContent = () => {
    switch (settingsSection) {
      case "profile":
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Profile Settings
              </h2>

              {/* Profile Picture */}
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-indigo-200 flex items-center justify-center">
                  <span className="text-indigo-700 font-bold text-2xl">JD</span>
                </div>
                <div className="ml-6">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Change Photo
                  </button>
                  <p className="text-sm text-gray-500 mt-1">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      defaultValue="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      defaultValue="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    defaultValue="johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    defaultValue="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="What's on your mind?"
                    defaultValue="Available for meetings"
                  />
                </div>
                <div className="pt-4">
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Notification Settings
              </h2>

              <div className="space-y-6">
                {/* General Notifications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    General
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">
                          Enable Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive notifications for new messages
                        </p>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifications ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                        onClick={() => setNotifications(!notifications)}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">
                          Sound Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Play sound for new messages
                        </p>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          soundEnabled ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                        onClick={() => setSoundEnabled(!soundEnabled)}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            soundEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message Notifications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Messages
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">
                          Direct Messages
                        </p>
                        <p className="text-sm text-gray-500">
                          Notifications for 1:1 conversations
                        </p>
                      </div>
                      <select className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option>All messages</option>
                        <option>Mentions only</option>
                        <option>Off</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">
                          Group Messages
                        </p>
                        <p className="text-sm text-gray-500">
                          Notifications for group conversations
                        </p>
                      </div>
                      <select className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option>Mentions only</option>
                        <option>All messages</option>
                        <option>Off</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Privacy & Security
              </h2>

              <div className="space-y-6">
                {/* Privacy Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Privacy
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">Last Seen</p>
                        <p className="text-sm text-gray-500">
                          Who can see when you were last online
                        </p>
                      </div>
                      <select className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option>Everyone</option>
                        <option>Contacts only</option>
                        <option>Nobody</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">
                          Read Receipts
                        </p>
                        <p className="text-sm text-gray-500">
                          Show when you've read messages
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Security
                  </h3>
                  <div className="space-y-4">
                    <button className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">
                          Change Password
                        </p>
                        <p className="text-sm text-gray-500">
                          Update your account password
                        </p>
                      </div>
                      <span className="text-indigo-600">→</span>
                    </button>
                    <button className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">
                          Two-Factor Authentication
                        </p>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security
                        </p>
                      </div>
                      <span className="text-indigo-600">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Appearance
              </h2>

              <div className="space-y-6">
                {/* Theme Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Theme
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button className="p-4 border-2 border-indigo-600 rounded-lg bg-white">
                      <Sun size={24} className="mx-auto mb-2 text-yellow-500" />
                      <p className="text-sm font-medium">Light</p>
                    </button>
                    <button className="p-4 border-2 border-gray-300 rounded-lg bg-gray-900 text-white hover:border-gray-400">
                      <Moon size={24} className="mx-auto mb-2" />
                      <p className="text-sm font-medium">Dark</p>
                    </button>
                    <button className="p-4 border-2 border-gray-300 rounded-lg hover:border-gray-400">
                      <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-gradient-to-r from-yellow-400 to-gray-800"></div>
                      <p className="text-sm font-medium">Auto</p>
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Font Size
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="12"
                      max="20"
                      defaultValue="14"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Small</span>
                      <span>Medium</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "language":
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Language & Region
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Zone
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (Central European Time)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-20 bg-indigo-700 flex flex-col items-center py-6">
        <div className="flex flex-col items-center space-y-6">
          <button
            className={`p-3 rounded-xl transition-colors ${
              activeTab === "chats" ? "bg-indigo-800" : "hover:bg-indigo-600"
            }`}
            onClick={() => setActiveTab("chats")}
          >
            <MessageSquare className="text-white" size={24} />
          </button>
          <button
            className={`p-3 rounded-xl transition-colors ${
              activeTab === "contacts" ? "bg-indigo-800" : "hover:bg-indigo-600"
            }`}
            onClick={() => setActiveTab("contacts")}
          >
            <Users className="text-white" size={24} />
          </button>
          <button
            className={`p-3 rounded-xl transition-colors ${
              activeTab === "settings" ? "bg-indigo-800" : "hover:bg-indigo-600"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="text-white" size={24} />
          </button>
        </div>
        <div className="mt-auto">
          <button className="p-3 rounded-xl hover:bg-indigo-600 transition-colors">
            <LogOut className="text-white" size={24} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "chats" && (
        <>
          {renderChatList()}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center">
                    <span className="text-indigo-700 font-semibold">
                      {chats.find((c) => c.id === selectedChat)?.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h2 className="font-semibold text-gray-800">
                      {chats.find((c) => c.id === selectedChat)?.name}
                    </h2>
                    <p className="text-xs text-green-500 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Online
                    </p>
                  </div>
                </div>

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
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                            msg.isMine
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-gray-800 border border-gray-200"
                          }`}
                        >
                          {!msg.isMine && (
                            <div className="font-semibold text-sm mb-1">
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
                      className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                      placeholder="Type a message..."
                      rows={1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <button
                      className="ml-2 p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none transition-colors disabled:opacity-50"
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
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
                  <button
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    onClick={() => setShowNewChatModal(true)}
                  >
                    Start New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "contacts" && (
        <>
          {renderContactsList()}
          {selectedContact ? (
            renderContactDetails()
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Users size={48} className="mx-auto text-gray-400" />
                <h2 className="mt-2 text-xl font-semibold text-gray-700">
                  Select a contact
                </h2>
                <p className="mt-1 text-gray-500">
                  Choose a contact to view their details
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "settings" && (
        <>
          {renderSettingsList()}
          {renderSettingsContent()}
        </>
      )}

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
    </div>
  );
}

export default Reference;
