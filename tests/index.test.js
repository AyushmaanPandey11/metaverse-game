const { default: axiosClass } = require("axios");

const BACKEND_URL = "http://localhost:8080";
const WS_URL = "http://localhost:3001";

const axios = {
  post: async (...args) => {
    try {
      const response = await axiosClass.post(...args);
      return response;
    } catch (error) {
      return error.response;
    }
  },
  get: async (...args) => {
    try {
      const response = await axiosClass.get(...args);
      return response;
    } catch (error) {
      return error.response;
    }
  },
  put: async (...args) => {
    try {
      const response = await axiosClass.put(...args);
      return response;
    } catch (error) {
      return error.response;
    }
  },
  delete: async (...args) => {
    try {
      const response = await axiosClass.delete(...args);
      return response;
    } catch (error) {
      return error.response;
    }
  },
};

describe.skip("User Authentication", () => {
  let username = `ayushmaan${Math.random()}`;
  let password = `ayushmaan123123`;
  test("user can create a account only once", async () => {
    const firstResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/signup`,
      {
        username,
        password,
        role: "admin",
      }
    );
    expect(firstResponse.status).toBe(200);
    const secondResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/signup`,
      {
        username,
        password,
        role: "admin",
      }
    );
    expect(secondResponse.status).toBe(500);
  });
  test("user can't sign up without username", async () => {
    const response = await axios.post(`${BACKEND_URL}/api/v1/user/signup`, {
      password: "123123",
    });
    expect(response.status).toBe(404);
  });
  test("user signin success after signing up", async () => {
    await axios.post(`${BACKEND_URL}/api/v1/user/signup`, {
      username,
      password,
      role: "admin",
    });

    const signinResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/signin`,
      {
        username,
        password,
      }
    );
    expect(signinResponse.status).toBe(200);
    expect(signinResponse.data.token).toBeDefined();
  });
  test("user signin fails with wrong password", async () => {
    await axios.post(`${BACKEND_URL}/api/v1/user/signup`, {
      username,
      password,
      role: "admin",
    });

    const signinResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/signin`,
      {
        username: "wrongUsername",
        password,
      }
    );
    expect(signinResponse.status).toBe(404);
  });
});

describe.skip("User metadata", () => {
  let token = "";
  let avatarId = "";

  beforeAll(async () => {
    let username = `ayushmaan${Math.random()}`;
    let password = `ayushmaan123123`;
    await axios.post(`${BACKEND_URL}/api/v1/user/signup`, {
      username,
      password,
      role: "admin",
    });
    const signinResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/signin`,
      {
        username,
        password,
      }
    );
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
    expect(avatarResponse.status).toBe(500);
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
    expect(avatarResponse.status).toBe(401);
  });
});

describe.skip("User Avatar endpoints", () => {
  let userId = "";
  let token = "";
  let avatarId = "";

  beforeAll(async () => {
    let username = `ayushmaan${Math.random()}`;
    let password = `ayushmaan123123`;
    const response = await axios.post(`${BACKEND_URL}/api/v1/user/signup`, {
      username,
      password,
      role: "admin",
    });
    userId = response.data.userId;
    const signinResponse = await axios.post(
      `${BACKEND_URL}/api/v1/user/signin`,
      {
        username,
        password,
      }
    );
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
      `${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`
    );
    expect(usersResponse.data.avatars.length).toBe(1);
    expect(usersResponse.data.avatars[0].userId).toBe(userId);
  });

  test("fetch available list of avatars", async () => {
    const avatarsListResponse = await axios.get(
      `${BACKEND_URL}/api/v1/user/metadata/avatars`
    );
    expect(avatarsListResponse.data.avatars.length).not.toBe(0);
    const currentAvatar = avatarsListResponse.data.avatars.find(
      (av) => av.id === avatarId
    );
    expect(currentAvatar).toBeDefined();
  });
});

describe.skip("Space information", () => {
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
    const adminSignupRes = await axios.post(
      `${BACKEND_URL}/api/v1/user/signup`,
      {
        username,
        password,
        role: "admin",
      }
    );
    adminId = adminSignupRes.data.userId;

    const adminSigninRes = await axios.post(
      `${BACKEND_URL}/api/v1/user/signin`,
      {
        username,
        password,
      }
    );
    adminToken = adminSigninRes.data.token;

    const userSignupRes = await axios.post(
      `${BACKEND_URL}/api/v1/user/signup`,
      {
        username: "user123",
        password: "34509823",
        role: "user",
      }
    );
    userId = userSignupRes.data.userId;

    const userSigninRes = await axios.post(
      `${BACKEND_URL}/api/v1/user/signin`,
      {
        username: "user123",
        password: "34509823",
      }
    );
    userToken = userSigninRes.data.token;

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
        mapId,
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
    expect(response.status).toBe(404);
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

    expect(response.status).toBe(404);
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
      `${BACKEND_URL}/api/v1/space/byId/${spaceResponse.data.spaceId}`,
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

    expect(deleteReponse.status).toBe(404);
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
    expect(spacesResponse.data.spaces.length).toBe(1);
    const filterdSpace = spacesResponse.data.spaces.find(
      (sp) => sp.id === response.data.spaceId
    );
    expect(filterdSpace.id).toBeDefined();
  });
});

describe.skip("Arena information", () => {
  let userId;
  let userToken;
  let adminId;
  let adminToken;
  let elementOneId;
  let elementTwoId;
  let mapId;
  let spaceId;

  beforeAll(async () => {
    // creating two users, admin and user
    const username = `ayushmaan${Math.random()}`;
    const password = `ayushmaan123123`;
    const adminSignupRes = await axios.post(
      `${BACKEND_URL}/api/v1/user/signup`,
      {
        username,
        password,
        role: "admin",
      }
    );
    adminId = adminSignupRes.data.userId;

    const adminSigninRes = await axios.post(
      `${BACKEND_URL}/api/v1/user/signin`,
      {
        username,
        password,
      }
    );
    adminToken = adminSigninRes.data.token;

    const userSignupRes = await axios.post(
      `${BACKEND_URL}/api/v1/user/signup`,
      {
        username: "user123",
        password: "34509823",
        role: "user",
      }
    );
    userId = userSignupRes.data.userId;

    const userSigninRes = await axios.post(
      `${BACKEND_URL}/api/v1/user/signin`,
      {
        username: "user123",
        password: "34509823",
      }
    );
    userToken = userSigninRes.data.token;

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

    const spaceResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "test",
        dimensions: "100x200",
        mapId,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    spaceId = spaceResponse.data.spaceId;
  });

  test("Wrong space Id returns a 404 code", async () => {
    const response = await axios.get(
      `${BACKEND_URL}/api/v1/space/wrongSpaceId123`
    );
    expect(response.status).toBe(404);
  });

  test("Correct space Id returns space elements", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`);
    expect(response.data.dimensions).toBe("100x200");
    expect(response.data.elements.length).toBe(3);
  });

  test("User can delete elements from the space", async () => {
    const spaceRes = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`);
    await axios.delete(`${BACKEND_URL}/api/v1/space/element`, {
      data: {
        spaceId,
        elementId: spaceRes.data.elements[0].id,
      },
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });
    const newSpaceResponse = await axios.get(
      `${BACKEND_URL}/api/v1/space/${spaceId}`
    );
    expect(newSpaceResponse.data.elements.length).toBe(2);
  });

  test("User can add an element in the space within its dimensions", async () => {
    const spaceResponse = await axios.get(
      `${BACKEND_URL}/api/v1/space/${spaceId}`
    );
    await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        elementId: elementTwoId,
        spaceId: spaceId,
        x: 50,
        y: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    const newSpaceResponse = await axios.get(
      `${BACKEND_URL}/api/v1/space/${spaceId}`
    );
    expect(spaceResponse.data.elements.length).toBe(2);
    expect(newSpaceResponse.data.elements.length).toBe(3);
    expect(newSpaceResponse.data.elements[2].element.id).toBe(elementTwoId);
  });

  test("User cannot add elements in the space outside its dimension", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        elementId: elementOneId,
        spaceId,
        x: 30000,
        y: 50000,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.status).toBe(400);
  });
});

// describe("admin endpoints tests", () => {
//   let userId;
//   let userToken;
//   let adminId;
//   let adminToken;
//   let elementId = "";
//   let avatarId = "";

//   beforeAll(async () => {
//     // creating two users, admin and user
//     const username = `ayushmaan${Math.random()}`;
//     const password = `ayushmaan123123`;
//     const adminSignupRes = await axios.post(
//       `${BACKEND_URL}/api/v1/user/signup`,
//       {
//         username,
//         password,
//         role: "admin",
//       }
//     );
//     adminId = adminSignupRes.data.userId;

//     const adminSigninRes = await axios.post(
//       `${BACKEND_URL}/api/v1/user/signin`,
//       {
//         username,
//         password,
//       }
//     );
//     adminToken = adminSigninRes.data.token;

//     const userSignupRes = await axios.post(
//       `${BACKEND_URL}/api/v1/user/signup`,
//       {
//         username: "user123",
//         password: "34509823",
//         role: "user",
//       }
//     );
//     userId = userSignupRes.data.userId;

//     const userSigninRes = await axios.post(
//       `${BACKEND_URL}/api/v1/user/signin`,
//       {
//         username: "user123",
//         password: "34509823",
//       }
//     );
//     userToken = userSigninRes.data.token;

//     const avatarResponse = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/avatar`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
//         name: "Timmy",
//       },
//       {
//         headers: {
//           authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );
//     avatarId = avatarResponse.data.avatarId;
//   });

//   test("admin can only create element", async () => {
//     const elemenRes = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/element`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
//         width: 1,
//         height: 1,
//         static: true, // weather or not the user can sit on top of this element (is it considered as a collission or not)
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );
//     expect(elemenRes.status).toBe(200);
//     expect(elemenRes.data.id).toBeDefined();
//     elementId = elemenRes.data.id;
//   });

//   test("user cannot create element", async () => {
//     const elemenRes = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/element`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
//         width: 1,
//         height: 1,
//         static: true, // weather or not the user can sit on top of this element (is it considered as a collission or not)
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${userToken}`,
//         },
//       }
//     );
//     expect(elemenRes.status).toBe(404);
//   });

//   test("admin can only update element", async () => {
//     const adminRes = await axios.put(
//       `${BACKEND_URL}/api/v1/admin/element/${elementId}`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );
//     expect(adminRes.status).toBe(200);

//     const userRes = await axios.put(
//       `${BACKEND_URL}/api/v1/admin/element/${elementId}`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${userToken}`,
//         },
//       }
//     );
//     expect(userRes.status).toBe(404);
//   });

//   test("admin can only create avatar", async () => {
//     const adminRes = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/avatar`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
//         name: "Timmy",
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );
//     expect(adminRes.status).toBe(200);
//     expect(adminRes.data.avatarId).toBeDefined();

//     const userRes = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/avatar`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
//         name: "Timmy",
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${userToken}`,
//         },
//       }
//     );
//     expect(userRes.status).toBe(404);
//   });

//   test("Admin can only create maps", async () => {
//     const elementOneRes = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/element`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
//         width: 1,
//         height: 1,
//         static: true,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );

//     const elementTwoRes = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/element`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
//         width: 1,
//         height: 1,
//         static: true,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );

//     const adminResponse = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/map`,
//       {
//         thumbnail: "https://thumbnail.com/a.png",
//         dimensions: "100x200",
//         name: "100 person interview room",
//         defaultElements: [
//           {
//             elementId: elementOneRes.data.id,
//             x: 20,
//             y: 20,
//           },
//           {
//             elementId: elementTwoRes.data.id,
//             x: 18,
//             y: 20,
//           },
//         ],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );
//     expect(adminResponse.status).toBe(200);
//     expect(adminResponse.data.id).toBeDefined();

//     const userResponse = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/map`,
//       {
//         thumbnail: "https://thumbnail.com/a.png",
//         dimensions: "100x200",
//         name: "100 person interview room",
//         defaultElements: [
//           {
//             elementId: elementOneRes.data.id,
//             x: 20,
//             y: 20,
//           },
//           {
//             elementId: elementTwoRes.data.id,
//             x: 18,
//             y: 20,
//           },
//         ],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${userToken}`,
//         },
//       }
//     );
//     expect(userResponse.status).toBe(404);
//   });
// });

// describe("websocket testing for events", () => {
//   let userId;
//   let userToken;
//   let adminId;
//   let adminToken;
//   let elementOneId;
//   let elementTwoId;
//   let mapId;
//   let spaceId;
//   let ws1;
//   let ws1Message = [];
//   let ws2;
//   let ws2Message = [];
//   let adminX;
//   let adminY;
//   let userX;
//   let userY;

//   const getRespondMessageFromWs = async (wsMessage) => {
//     while (wsMessage.length === 0) {
//       await new Promise((resolve) => setTimeout(resolve, 100));
//     }
//     return wsMessage.shift();
//   };

//   const initializeWsServer = async () => {
//     ws1 = new WebSocket(WS_URL);
//     await new Promise((resolve) => {
//       ws1.onopen = resolve;
//     });

//     ws1.onmessage = (event) => {
//       ws1Message.push(JSON.parse(event.data));
//     };

//     ws2 = new WebSocket(WS_URL);
//     await new Promise((resolve) => {
//       ws2.onopen = resolve;
//     });

//     ws2.onmessage = (event) => {
//       ws2Message.push(JSON.parse(event.data));
//     };
//   };

//   const initializeHttpServer = async () => {
//     // creating two users, admin and user
//     const username = `ayushmaan${Math.random()}`;
//     const password = `ayushmaan123123`;
//     const adminSignupRes = await axios.post(`${BACKEND_URL}/api/v1/user/signup`, {
//       username,
//       password,
//       role: "admin",
//     });
//     adminId = adminSignupRes.data.userId;

//     const adminSigninRes = await axios.post(`${BACKEND_URL}/api/v1/user/signin`, {
//       username,
//       password,
//     });
//     adminToken = adminSigninRes.data.userId;

//     const userSignupRes = await axios.post(`${BACKEND_URL}/api/v1/user/signup`, {
//       username: "user123",
//       password: "34509823",
//       role: "user",
//     });
//     userId = userSignupRes.data.userId;

//     const userSigninRes = await axios.post(`${BACKEND_URL}/api/v1/user/signin`, {
//       username: "user123",
//       password: "34509823",
//     });
//     userToken = userSigninRes.data.userId;

//     // creating elements
//     const elementOneRes = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/element`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
//         width: 1,
//         height: 1,
//         static: true,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );

//     const elementTwoRes = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/element`,
//       {
//         imageUrl:
//           "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
//         width: 1,
//         height: 1,
//         static: true,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );
//     elementOneId = elementOneRes.data.id;
//     elementTwoId = elementTwoRes.data.id;

//     const mapResponse = await axios.post(
//       `${BACKEND_URL}/api/v1/admin/map`,
//       {
//         thumbnail: "https://thumbnail.com/a.png",
//         dimensions: "100x200",
//         name: "100 person interview room",
//         defaultElements: [
//           {
//             elementId: elementOneId,
//             x: 20,
//             y: 20,
//           },
//           {
//             elementId: elementOneId,
//             x: 18,
//             y: 20,
//           },
//           {
//             elementId: elementTwoId,
//             x: 19,
//             y: 20,
//           },
//         ],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${adminToken}`,
//         },
//       }
//     );
//     mapId = mapResponse.data.id;

//     const spaceResponse = await axios.post(
//       `${BACKEND_URL}/api/v1/space`,
//       {
//         name: "test",
//         dimensions: "100x200",
//         mapId,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${userToken}`,
//         },
//       }
//     );
//     spaceId = spaceResponse.data.spaceId;
//   };

//   beforeAll(async () => {
//     await initializeHttpServer();
//     await initializeWsServer();
//   });

//   test("user can join a space", async () => {
//     ws1.send(
//       JSON.stringify({
//         type: "join",
//         payload: {
//           spaceId: spaceId,
//           token: adminToken,
//         },
//       })
//     );
//     const adminWsReponse = await getRespondMessageFromWs(ws1Message);

//     ws1.send(
//       JSON.stringify({
//         type: "join",
//         payload: {
//           spaceId: spaceId,
//           token: userToken,
//         },
//       })
//     );
//     const userWsReponse = await getRespondMessageFromWs(ws1Message);
//     expect(adminWsReponse.type).toBe("space-joined");
//     expect(userWsReponse.type).toBe("space-joined");
//     expect(adminWsReponse.payload.users.length).toBe(0);
//     expect(userWsReponse.payload.users.length).toBe(1);
//     adminX = adminWsReponse.payload.spawn.x;
//     adminY = adminWsReponse.payload.spawn.y;

//     userX = message2.payload.spawn.x;
//     userY = message2.payload.spawn.y;
//   });

//   test("uesr cannot move outside the space bounds", async () => {
//     ws1.send(
//       JSON.stringify({
//         type: "move",
//         payload: {
//           x: 2000,
//           y: 3000,
//         },
//       })
//     );
//     const response = await getRespondMessageFromWs(ws1Message);
//     expect(response.type).toBe("movement-rejected");
//     expect(response.payload.x).toBe(adminX);
//     expect(response.payload.y).toBe(adminY);
//   });
//   test("User should not be able to move two blocks at the same time", async () => {
//     ws1.send(
//       JSON.stringify({
//         type: "move",
//         payload: {
//           x: adminX + 2,
//           y: adminY,
//         },
//       })
//     );

//     const message = await waitForAndPopLatestMessage(ws1Messages);
//     expect(message.type).toBe("movement-rejected");
//     expect(message.payload.x).toBe(adminX);
//     expect(message.payload.y).toBe(adminY);
//   });
//   test("Correct movement should be broadcasted to the other sockets in the room", async () => {
//     ws1.send(
//       JSON.stringify({
//         type: "move",
//         payload: {
//           x: adminX + 1,
//           y: adminY,
//           userId: adminId,
//         },
//       })
//     );

//     const message = await waitForAndPopLatestMessage(ws2Messages);
//     expect(message.type).toBe("movement");
//     expect(message.payload.x).toBe(adminX + 1);
//     expect(message.payload.y).toBe(adminY);
//   });
//   test("If a user leaves, the other user receives a leave event", async () => {
//     ws1.close();
//     const message = await waitForAndPopLatestMessage(ws2Messages);
//     expect(message.type).toBe("user-left");
//     expect(message.payload.userId).toBe(adminId);
//   });
// });
