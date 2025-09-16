const { default: axios } = require("axios");

const BACKEND_URL = "http://localhost:3000";

describe("User Authentication", () => {
  let username = `ayushmaan${Math.random()}`;
  let password = `ayushmaan123123`;
  test("user can create a account only once", async () => {
    const firstResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      role: "admin",
    });
    expect(firstResponse.status).toBe(200);
    const secondResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      role: "admin",
    });
    expect(secondResponse.status).toBe(400);
  });
  test("user can't sign up without username", async () => {
    const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      password: "123123",
    });
    expect(response.status).toBe(400);
  });
  test("user signin success after signing up", async () => {
    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      role: "admin",
    });

    const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    expect(signinResponse.status).toBe(200);
    expect(signinResponse.data.token).toBeDefined();
  });
  test("user signin fails with wrong password", async () => {
    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      role: "admin",
    });

    const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: "wrongUsername",
      password,
    });
    expect(signinResponse.status).toBe(400);
  });
});

describe("User metadata", () => {
  let token = "";
  let avatarId = "";
  beforeAll(async () => {
    let username = `ayushmaan${Math.random()}`;
    let password = `ayushmaan123123`;
    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      role: "admin",
    });
    const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    token = signinResponse.data.token;

    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        name: "Timmy",
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    avatarId = avatarResponse.data.avatarId;
  });
  test("user can't update avatar with wrong avatarId", async () => {
    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      {
        avatarId: "123345345",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(avatarResponse.status).toBe(400);
  });
  test("user can update avatar with right avatarId", async () => {
    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      {
        avatarId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(avatarResponse.status).toBe(200);
  });
  test("user can't update avatar without sending auth header", async () => {
    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      {
        avatarId,
      }
    );
    expect(avatarResponse.status).toBe(403);
  });
});

describe("User Avatar endpoints", () => {
  let userId = "";
  let token = "";
  let avatarId = "";
  beforeAll(async () => {
    let username = `ayushmaan${Math.random()}`;
    let password = `ayushmaan123123`;
    const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      role: "admin",
    });
    userId = response.data.userId;
    const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    token = signinResponse.data.token;

    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        name: "Timmy",
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    avatarId = avatarResponse.data.avatarId;
  });

  test("getting back user's avatar information", async () => {
    const updateResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      {
        avatarId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(updateResponse.status).toBe(200);
    const usersResponse = await axios.get(
      `${BACKEND_URL}/api/v1/metadata/bulk?ids=[${userId}]`
    );
    expect(usersResponse.data.avatars.length).toBe(1);
    expect(usersResponse.data.avatars[0].userId).toBe(userId);
  });

  test("fetch available list of avatars", async () => {
    const avatarsListResponse = await axios.get(
      `${BACKEND_URL}/api/v1/avatars`
    );
    expect(avatarsListResponse.data.avatars.length).not.toBe(0);
    const currentAvatar = avatarsListResponse.data.avatars.find(
      (av) => av.id === avatarId
    );
    exptect(currentAvatar).toBeDefined();
  });
});

describe("Space information", () => {});
