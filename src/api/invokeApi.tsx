import axiosInstance from "./axios";

// Allowed HTTP methods: "GET" or "POST"

/**
 * @typedef {Object} ApiConstant
 * @property {string} actionType
 * @property {string} endpointx
 * @property {string} method
 * @property {string} [originalEndpoint]
 * @property {string} [modifiedEndpoint]
 */

interface ApiConstant {
  endpoint: string;
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  originalEndpoint?: string;
  modifiedEndpoint?: string;
}

type Params = Record<string, string | number>;
type Data = unknown;
type Config = Record<string, unknown>;

const invokeApi = async (
  action: ApiConstant,
  data: Data = null,
  params: Params = {},
  config: Config = {}
): Promise<import("axios").AxiosResponse> => {
  let response;

  // Replace dynamic route parameters
  if (Object.keys(params).length > 0) {
    Object.entries(params).forEach(([key, value]) => {
      action.endpoint = action.endpoint.replace(`:${key}`, String(value));
    });
  }

  try {
    switch (action.method) {
      case "POST":
        response = await axiosInstance.post(action.endpoint, data, config);
        break;
      case "GET":
        response = await axiosInstance.get(action.endpoint, config); // Note: no `data` for GET
        break;
      default:
        throw new Error(`Unsupported method "${action.method}"`);
    }

    return response;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

export default invokeApi;
