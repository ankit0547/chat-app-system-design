const apiConstant = {
  USER_REGISTER: {
    endpoint: "http://localhost:7805/api/chatapp/register",
    method: "POST",
  },
  USER_LOGIN: {
    endpoint: "http://localhost:7805/api/chatapp/login",
    method: "POST",
  },
  USER_LOGOUT: {
    endpoint: "http://localhost:7805/api/chatapp/logout",
    method: "POST",
  },
} as const;

export default apiConstant;
