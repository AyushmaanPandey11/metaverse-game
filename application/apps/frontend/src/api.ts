import axios from "axios";

const BACKEND_URL = "http://localhost:8080";
const WS_URL = "http://localhost:3001";

export const api = {
  post: async (url: string, data: any, config?: any) => {
    try {
      const response = await axios.post(url, data, config);
      return response;
    } catch (error: any) {
      return error.response;
    }
  },
  get: async (url: string, config?: any) => {
    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error: any) {
      return error.response;
    }
  },
  put: async (url: string, data: any, config?: any) => {
    try {
      const response = await axios.put(url, data, config);
      return response;
    } catch (error: any) {
      return error.response;
    }
  },
  delete: async (url: string, config?: any) => {
    try {
      const response = await axios.delete(url, config);
      return response;
    } catch (error: any) {
      return error.response;
    }
  },
};

export const signup = async (
  username: string,
  password: string,
  role: "User" | "Admin"
) => {
  return api.post(`${BACKEND_URL}/api/v1/user/signup`, {
    username,
    password,
    role: role === "User" ? "user" : "admin",
  });
};

export const signin = async (username: string, password: string) => {
  return api.post(`${BACKEND_URL}/api/v1/user/signin`, { username, password });
};

export const updateAvatar = async (avatarId: string, token: string) => {
  return api.post(
    `${BACKEND_URL}/api/v1/user/metadata`,
    { avatarId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const getAvatars = async () => {
  return api.get(`${BACKEND_URL}/api/v1/user/metadata/avatars`);
};

export const getMaps = async () => {
  return api.get(`${BACKEND_URL}/api/v1/map/all`);
};

export const createSpace = async (
  name: string,
  dimensions: string,
  mapId?: string,
  token?: string
) => {
  return api.post(
    `${BACKEND_URL}/api/v1/space`,
    { name, dimensions, mapId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const deleteSpace = async (spaceId: string, token: string) => {
  return api.delete(`${BACKEND_URL}/api/v1/space/byId/${spaceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getSpace = async (spaceId: string) => {
  return api.get(`${BACKEND_URL}/api/v1/space/${spaceId}`);
};

export const addElementToSpace = async (
  spaceId: string,
  elementId: string,
  x: number,
  y: number,
  token: string
) => {
  return api.post(
    `${BACKEND_URL}/api/v1/space/element`,
    { spaceId, elementId, x, y },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const deleteElementFromSpace = async (
  spaceId: string,
  elementId: string,
  token: string
) => {
  return api.delete(`${BACKEND_URL}/api/v1/space/element`, {
    data: { spaceId, elementId },
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createElement = async (
  imageUrl: string,
  width: number,
  height: number,
  isStatic: boolean,
  token: string
) => {
  return api.post(
    `${BACKEND_URL}/api/v1/admin/element`,
    { imageUrl, width, height, static: isStatic },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const updateElement = async (
  elementId: string,
  imageUrl: string,
  token: string
) => {
  return api.put(
    `${BACKEND_URL}/api/v1/admin/element/${elementId}`,
    { imageUrl },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const createAvatar = async (
  imageUrl: string,
  name: string,
  token: string
) => {
  return api.post(
    `${BACKEND_URL}/api/v1/admin/avatar`,
    { imageUrl, name },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const createMap = async (
  name: string,
  thumbnail: string,
  dimensions: string,
  defaultElements: { elementId: string; x: number; y: number }[],
  token: string
) => {
  return api.post(
    `${BACKEND_URL}/api/v1/admin/map`,
    { name, thumbnail, dimensions, defaultElements },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const getSpaces = async (token: string) => {
  return api.get(`${BACKEND_URL}/api/v1/space/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const connectWebSocket = (spaceId?: string, token?: string) => {
  const ws = new WebSocket(WS_URL);
  if (spaceId) {
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { spaceId, token: token || "guest" },
        })
      );
    };
  }
  return ws;
};
