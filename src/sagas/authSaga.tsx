/* eslint-disable no-debugger */
// authSaga.js
import { put, takeLatest } from "redux-saga/effects";
import actiontypes from "../redux/actionTypes/auth";
import invokeApi from "../api/invokeApi";
import apiConstant from "../api/constants";
import { disconnectChat, setChatClient } from "../redux/actions/chat";
import { createChatClient } from "../websocket/clientManager";
import { navigateTo, setToken } from "../redux/actions/app";

interface UserFormPayload {
  formData: object;
}

interface UserRegisterAction {
  type: string;
  payload: UserFormPayload;
  navigate: (path: string) => void;
}
interface UserLoginAction {
  type: string;
  payload: UserFormPayload;
  navigate: (path: string) => void;
}

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: [];
}

function* handleUserRegister(
  action: UserRegisterAction
): Generator<unknown, void, unknown> {
  try {
    const response = (yield invokeApi(
      apiConstant.USER_REGISTER,
      action.payload.formData
    )) as ApiResponse;
    if (response && response.data) {
      yield put(navigateTo("/")); // ✅ dispatch navigation action
    }
    console.log(response);
  } catch (e: unknown) {
    console.log(e);
  }
}

function* handleUserLogin(
  action: UserLoginAction
): Generator<unknown, void, unknown> {
  try {
    const response = (yield invokeApi(
      apiConstant.USER_LOGIN,
      action.payload.formData
    )) as ApiResponse;

    if (response && response.data) {
      const { accessToken, refreshToken, user } = response.data as {
        accessToken: string;
        refreshToken: string;
        user?: { _id: string };
      };

      if (accessToken && refreshToken) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        // Optional chaining in case user or _id is missing
        if (user && user._id) {
          localStorage.setItem("userId", user._id);
        }
      }
      const localAccessToken = localStorage.getItem("accessToken");
      const localRefreshToken = localStorage.getItem("refreshToken");
      if (localAccessToken && localRefreshToken) {
        const chatClient = createChatClient(accessToken);
        yield put(setChatClient(chatClient)); // ✅ this persists client in redux
        chatClient.connect(); // ✅ now safely connected
        yield put(setToken(localAccessToken));
      }
    }
  } catch (e: unknown) {
    console.log(e);
  }
}
function* handleUserLogout(): Generator<unknown, void, unknown> {
  try {
    const response = (yield invokeApi(apiConstant.USER_LOGOUT)) as ApiResponse;
    if (response && response.data) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      yield put(disconnectChat()); // ✅ FIXED
      yield put(setToken(null));
    }
    console.log(response);
  } catch (e: unknown) {
    console.log(e);
  }
}

export default function* authSaga() {
  yield takeLatest(actiontypes.AUTH_REGISTER, handleUserRegister);
  yield takeLatest(actiontypes.AUTH_LOGIN, handleUserLogin);
  yield takeLatest(actiontypes.AUTH_LOGOUT, handleUserLogout);
}
