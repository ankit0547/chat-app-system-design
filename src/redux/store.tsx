// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import rootSaga from "../sagas/rootSaga.tsx";
import dashboardReducer from "./dashboardReducer.tsx";
import chatReducer from "./reducers/chatReducer.ts";
import appReducer from "./reducers/appReducer.ts";

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    DashboardStates: dashboardReducer,
    chat: chatReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default store;
