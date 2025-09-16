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

describe("Space information", () => {
  let userId;
  let userToken;
  let adminId;
  let adminToken;
  let elementOneId;
  let elementTwoId;
  let mapId;

  beforeAll(async () => {
    // creating two users, admin and user
    const username = `ayushmaan${Math.random()}`;
    const password = `ayushmaan123123`;
    const adminSignupRes = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      role: "admin",
    });
    adminId = adminSignupRes.data.userId;

    const adminSigninRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    adminToken = adminSigninRes.data.userId;

    const userSignupRes = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username: "user123",
      password: "34509823",
      role: "user",
    });
    userId = userSignupRes.data.userId;

    const userSigninRes = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: "user123",
      password: "34509823",
    });
    userToken = userSigninRes.data.userId;

    // creating elements
    const elementOneRes = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const elementTwoRes = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    elementOneId = elementOneRes.data.id;
    elementTwoId = elementTwoRes.data.id;

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "100 person interview room",
        defaultElements: [
          {
            elementId: elementOneId,
            x: 20,
            y: 20,
          },
          {
            elementId: elementOneId,
            x: 18,
            y: 20,
          },
          {
            elementId: elementTwoId,
            x: 19,
            y: 20,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapResponse.data.id;
  });

  test("user can create a space using existing map", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId: mapId,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.status).toBe(200);
    expect(response.data.spaceId).toBeDefined();
  });

  test("user can create a space without using existing map", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.status).toBe(200);
    expect(response.data.spaceId).toBeDefined();
  });

  test("user can't create a space with neither mapId nor dimensions", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.status).toBe(400);
  });

  test("User is not able to delete a space that doesnt exist", async () => {
    const response = await axios.delete(
      `${BACKEND_URL}/api/v1/space/nonExistentId`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    expect(response.status).toBe(400);
  });

  test("User is able to delete a space that does exist", async () => {
    const spaceResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    const response = await axios.delete(
      `${BACKEND_URL}/api/v1/space/${spaceResponse.data.spaceId}`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.status).toBe(200);
  });

  test("User should not be able to delete a space created by another", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const deleteReponse = await axios.delete(
      `${BACKEND_URL}/api/v1/space/${response.data.spaceId}`,
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    expect(deleteReponse.status).toBe(403);
  });

  test("no spaces present in admin side at first", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    expect(response.data.spaces.length).toBe(0);
  });

  test("gets spaces after creating one", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const spacesResponse = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    exptect(spacesResponse.data.spaces.length).toBe(1);
    const filterdSpace = spacesResponse.data.spaces.find(
      (sp) => sp.id === response.data.spaceId
    );
    exptect(filterdSpace.id).toBeDefined();
  });
});
