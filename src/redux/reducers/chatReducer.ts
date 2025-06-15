import { createReducer } from "@reduxjs/toolkit";
import * as actions from "../actions/chat";
import { ChatState } from "../../types/types";

const initialState: ChatState = {
  isConnected: false,
  client: null,
};

const chatReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(actions.chatConnected, (state) => {
      state.isConnected = true;
    })
    .addCase(actions.setChatClient, (state, action) => {
      // eslint-disable-next-line no-debugger
      debugger;
      state.client = action.payload;
    })
    .addCase(actions.chatDisconnected, (state) => {
      state.isConnected = false;
    })
    .addCase(actions.disconnectChat, (state) => {
      state.client?.disconnect(); // ✅ important
      state.client = null;
      state.isConnected = false;
    });
});

export default chatReducer;
