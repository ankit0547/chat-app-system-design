// src/features/counter/counterSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userAuthenticated: !!localStorage.getItem("accessToken"),
  selectedChat: null,
  allChats: [
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
  ],
};

const dashboardSlice = createSlice({
  name: "dashboardState",
  initialState,
  reducers: {
    incrementAsync: (state) => state, // dummy for saga
    selectChatAction: (state, action) => {
      state.selectedChat = action.payload;
    }, // dummy for saga
  },
});

export const { incrementAsync, selectChatAction } = dashboardSlice.actions;
export default dashboardSlice.reducer;
