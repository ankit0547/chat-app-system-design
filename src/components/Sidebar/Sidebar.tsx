import { MessageSquare, Users, Settings, LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { NavLink, useLocation } from "react-router-dom";
import { logoutUser } from "../../redux/actions/auth";

const Sidebar = () => {
  const history = useLocation();
  const activeTab = history.pathname.split("/")[1];
  const dispatch = useDispatch();
  // const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <aside>
      {/* Sidebar */}
      <div className="w-20 bg-indigo-700 flex flex-col items-center py-6 h-full">
        <div className="flex flex-col items-center space-y-6">
          <NavLink to="/chats">
            <button
              className={`p-3 rounded-xl ${
                activeTab === "chats" ? "bg-indigo-800" : "hover:bg-indigo-600"
              }`}
            >
              <MessageSquare className="text-white" size={24} />
            </button>
          </NavLink>

          <NavLink to="/contacts">
            <button
              className={`p-3 rounded-xl ${
                activeTab === "contacts"
                  ? "bg-indigo-800"
                  : "hover:bg-indigo-600"
              }`}
            >
              <Users className="text-white" size={24} />
            </button>
          </NavLink>
          <NavLink to="/settings">
            <button
              className={`p-3 rounded-xl ${
                activeTab === "settings"
                  ? "bg-indigo-800"
                  : "hover:bg-indigo-600"
              }`}
            >
              <Settings className="text-white" size={24} />
            </button>
          </NavLink>
        </div>
        <div className="mt-auto">
          <button
            className="p-3 rounded-xl hover:bg-indigo-600"
            onClick={handleLogout}
          >
            <LogOut className="text-white" size={24} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
