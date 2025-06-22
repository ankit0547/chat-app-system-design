import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import { Suspense, useEffect } from "react";
import { useSelector } from "react-redux";
import { ReduxState } from "../../types/types";
import { createChatClient } from "../../websocket/clientManager";

const DashboardLayout = () => {
  const navigate = useNavigate();

  const token = useSelector((state: ReduxState) => state.app.token);

  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  useEffect(() => {
    if (token) {
      const chatClient = createChatClient(token);
      chatClient.connect();
    }
  }, []);

  return (
    <Suspense fallback="Loading...">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </Suspense>
  );
};

export default DashboardLayout;
