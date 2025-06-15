import { useLocation } from "react-router-dom";
import Chats from "./Chats/Chats";

const Dashboard = () => {
  const history = useLocation();
  const activeTab = history.pathname.split("/")[1];

  return (
    <div className="flex h-screen bg-gray-100">
      {activeTab === "chats" && <Chats />}
      {activeTab === "contacts" && <div>Contacts </div>}
      {activeTab === "settings" && <div>Setting </div>}
    </div>
  );
};

export default Dashboard;
