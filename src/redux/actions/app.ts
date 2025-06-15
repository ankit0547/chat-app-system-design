import { createAction } from "@reduxjs/toolkit";
// import actiontypes from "../actionTypes/auth";

export const navigateTo = createAction<string>("app/navigateTo");
export const setToken = createAction<string | null>("app/setToken");
export const clearRedirect = createAction("app/clearRedirect");
