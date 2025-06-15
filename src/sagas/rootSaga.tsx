// src/saga/rootSaga.js
import { all } from "redux-saga/effects";
import authSaga from "./authSaga.tsx";
import { chatSaga } from "./chatSaga.tsx";

export default function* rootSaga() {
  yield all([authSaga(), chatSaga()]);
}
