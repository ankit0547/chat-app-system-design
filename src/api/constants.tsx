const apiBaseURL = import.meta.env.VITE_APP_API_URL;
const apiConstant = {
  USER_REGISTER: {
    endpoint: `${apiBaseURL}/api/chatapp/register`,
    method: "POST",
  },
  USER_LOGIN: {
    endpoint: `${apiBaseURL}/api/chatapp/login`,
    method: "POST",
  },
  USER_LOGOUT: {
    endpoint: `${apiBaseURL}/api/chatapp/logout`,
    method: "GET",
  },
} as const;

export default apiConstant;
