import { useSelector } from "react-redux";
import { AppStateType } from "../../../types/appTypes";

type Chat = {
  id: number;
  name: string;
  // add other properties if needed
};

interface ChatHeaderProps {
  chats: Chat[];
}

const ChatHeader = ({ chats }: ChatHeaderProps) => {
  const { selectedChat } = useSelector(
    (state: AppStateType) => state.DashboardStates
  );
  return (
    <>
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
    </>
  );
};

export default ChatHeader;
