const apiBaseURL = import.meta.env.VITE_APP_API_URL;
const apiConstant = {
  USER_REGISTER: {
    endpoint: `${apiBaseURL}/api/register`,
    method: "POST",
  },
  USER_LOGIN: {
    endpoint: `${apiBaseURL}/api/login`,
    method: "POST",
  },
  USER_LOGOUT: {
    endpoint: `${apiBaseURL}/api/logout`,
    method: "GET",
  },
  CREATE_DIRECT_CONVERSATION: {
    endpoint: `${apiBaseURL}/api/conversation/direct`,
    method: "POST",
  },
  CREATE_GROUP_CONVERSATION: {
    endpoint: `${apiBaseURL}/api/conversation/group`,
    method: "POST",
  },
} as const;

export default apiConstant;
