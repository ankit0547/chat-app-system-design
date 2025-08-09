import { createReducer } from "@reduxjs/toolkit";
import * as actions from "../actions/chat";
import { ChatState } from "../../types/types";

const initialState: ChatState = {
  isConnected: false,
  client: null,
  allChats: [],
  selectedChat: null,
  conversations: [],
  participantStatus: {},
};

const chatReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(actions.chatConnected, (state) => {
      state.isConnected = true;
    })
    .addCase(actions.setChatClient, (state, action) => {
      state.client = action.payload;
    })
    .addCase(actions.chatDisconnected, (state) => {
      state.isConnected = false;
    })
    .addCase(actions.disconnectChat, (state) => {
      state.client?.disconnect(); // ✅ important
      state.client = null;
      state.isConnected = false;
    })
    .addCase(actions.setUserConversations, (state, action) => {
      state.allChats = action.payload;
    })
    .addCase(actions.setSelectedConversations, (state, action) => {
      state.selectedChat = action.payload;
    })
    .addCase(actions.setUserConversationsTest, (state, action) => {
      state.conversations = action.payload;
    })
    .addCase(actions.updateUserPresence, (state, action) => {
      const { userId, status, timestamp } = action.payload;
      return {
        ...state,
        participantStatus: {
          ...state.participantStatus,
          [userId]: {
            isOnline: status === "online",
            lastSeen:
              status === "offline"
                ? timestamp
                : state.participantStatus[userId]?.lastSeen,
          },
        },
      };
    });
});

export default chatReducer;
