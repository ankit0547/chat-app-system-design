import { Bell, Edit3, Globe, Moon, Palette, Shield, Sun } from "lucide-react";
import React, { useState } from "react";

const Settings = () => {
  const [settingsSection, setSettingsSection] = useState("profile");
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  console.log(">>>>", settingsSection);

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
    <div className="flex">
      {" "}
      {renderSettingsList()}
      {renderSettingsContent()}
    </div>
  );
};

export default Settings;
