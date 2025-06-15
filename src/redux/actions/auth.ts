import { createAction } from "@reduxjs/toolkit";
import actiontypes from "../actionTypes/auth";

interface UserRegisterPayload {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
}
interface UserLoginPayload {
  password: string;
  email: string;
}

export const registerUser = createAction<{
  formData: UserRegisterPayload;
}>(actiontypes.AUTH_REGISTER);

export const loginUser = createAction<{
  formData: UserLoginPayload;
}>(actiontypes.AUTH_LOGIN);

export const logoutUser = createAction(actiontypes.AUTH_LOGOUT);

export const setServerErrors = createAction<{ serverErrors: [] }>(
  "auth/setServerErrors"
);
