import { createReducer } from "@reduxjs/toolkit";
import * as actions from "../actions/app";
import { AppState } from "../../types/types";

const initialState: AppState = {
  redirectPath: null,
  token: localStorage.getItem("accessToken"),
};

const appReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(actions.navigateTo, (state, action) => {
      state.redirectPath = action.payload !== undefined ? action.payload : null;
    })
    .addCase(actions.clearRedirect, (state) => {
      state.redirectPath = null;
    })
    .addCase(actions.setToken, (state, action) => {
      state.token = action.payload !== undefined ? action.payload : null;
    });
});

export default appReducer;
