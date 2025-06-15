import { createReducer } from "@reduxjs/toolkit";
import * as actions from "../actions/auth";
import { AuthState } from "../../types/types";

const initialState: AuthState = {
  serverErrors: [],
};

const authReducer = createReducer(initialState, (builder) => {
  builder.addCase(actions.setServerErrors, (state, action) => {
    state.serverErrors = action.payload.serverErrors;
  });
});

export default authReducer;
