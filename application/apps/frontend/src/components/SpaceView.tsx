import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSpace,
  addElementToSpace,
  deleteElementFromSpace,
  connectWebSocket,
} from "../api";
import type { User, Space } from "../types";

interface SpaceViewProps {
  user: User | null;
}

const SpaceView: React.FC<SpaceViewProps> = ({ user }) => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [space, setSpace] = useState<Space | null>(null);
  const [userPosition, setUserPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [users, setUsers] = useState<
    { userId: string; x: number; y: number }[]
  >([]);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Arena state and refs
  const arenaCanvasRef = useRef<any>(null);
  const arenaWsRef = useRef<any>(null);
  const [arenaCurrentUser, setArenaCurrentUser] = useState<any>({});
  const [arenaUsers, setArenaUsers] = useState(new Map());
  const [arenaParams, setArenaParams] = useState({ token: "", spaceId: "" });

  // Initialize Arena WebSocket connection when no spaceId is provided
  useEffect(() => {
    if (spaceId === "demo") {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token") || user?.token || "";
      const arenaSpaceId = urlParams.get("spaceId") || "arena";
      setArenaParams({ token, spaceId: arenaSpaceId });

      // Initialize WebSocket
      arenaWsRef.current = new WebSocket("ws://localhost:3001"); // Replace with your WS_URL

      arenaWsRef.current.onopen = () => {
        // Join the space once connected
        arenaWsRef.current.send(
          JSON.stringify({
            type: "join",
            payload: {
              spaceId: arenaSpaceId,
              token,
            },
          })
        );
      };

      arenaWsRef.current.onmessage = (event: any) => {
        const message = JSON.parse(event.data);
        handleArenaWebSocketMessage(message);
      };

      return () => {
        if (arenaWsRef.current) {
          arenaWsRef.current.close();
        }
      };
    }
  }, [spaceId, user?.token]);

  const handleArenaWebSocketMessage = (message: any) => {
    switch (message.type) {
      case "space-joined":
        setArenaCurrentUser({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId,
        });

        // Initialize other users from the payload
        const userMap = new Map();
        message.payload.users.forEach((user: any) => {
          userMap.set(user.userId, user);
        });
        setArenaUsers(userMap);
        break;

      case "user-joined":
        setArenaUsers((prev) => {
          const newUsers = new Map(prev);
          newUsers.set(message.payload.userId, {
            x: message.payload.x,
            y: message.payload.y,
            userId: message.payload.userId,
          });
          return newUsers;
        });
        break;

      case "movement":
        setArenaUsers((prev) => {
          const newUsers = new Map(prev);
          const user = newUsers.get(message.payload.userId);
          if (user) {
            user.x = message.payload.x;
            user.y = message.payload.y;
            newUsers.set(message.payload.userId, user);
          }
          return newUsers;
        });
        break;

      case "movement-rejected":
        // Reset current user position if movement was rejected
        setArenaCurrentUser((prev: any) => ({
          ...prev,
          x: message.payload.x,
          y: message.payload.y,
        }));
        break;

      case "user-left":
        setArenaUsers((prev) => {
          const newUsers = new Map(prev);
          newUsers.delete(message.payload.userId);
          return newUsers;
        });
        break;
    }
  };

  // Handle arena user movement
  const handleArenaMove = (newX: any, newY: any) => {
    if (!arenaCurrentUser) return;

    // Send movement request
    arenaWsRef.current.send(
      JSON.stringify({
        type: "move",
        payload: {
          x: newX,
          y: newY,
          userId: arenaCurrentUser.userId,
        },
      })
    );
  };

  // Draw the arena
  useEffect(() => {
    if (!spaceId) {
      const canvas = arenaCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "#eee";
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw current user
      if (arenaCurrentUser && arenaCurrentUser.x) {
        ctx.beginPath();
        ctx.fillStyle = "#FF6B6B";
        ctx.arc(
          arenaCurrentUser.x * 50,
          arenaCurrentUser.y * 50,
          20,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "You",
          arenaCurrentUser.x * 50,
          arenaCurrentUser.y * 50 + 40
        );
      }

      // Draw other users
      arenaUsers.forEach((user) => {
        if (!user.x) return;
        ctx.beginPath();
        ctx.fillStyle = "#4ECDC4";
        ctx.arc(user.x * 50, user.y * 50, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`User ${user.userId}`, user.x * 50, user.y * 50 + 40);
      });
    }
  }, [arenaCurrentUser, arenaUsers, spaceId]);

  const handleArenaKeyDown = (e: any) => {
    if (!spaceId && arenaCurrentUser) {
      const { x, y } = arenaCurrentUser;
      switch (e.key) {
        case "ArrowUp":
          handleArenaMove(x, y - 1);
          break;
        case "ArrowDown":
          handleArenaMove(x, y + 1);
          break;
        case "ArrowLeft":
          handleArenaMove(x - 1, y);
          break;
        case "ArrowRight":
          handleArenaMove(x + 1, y);
          break;
      }
    }
  };

  // Original SpaceView logic (only when spaceId exists)
  useEffect(() => {
    if (spaceId && spaceId !== "demo") {
      const fetchSpace = async () => {
        const response = await getSpace(spaceId);
        if (response.status === 200) {
          setSpace(response.data);
        }
      };
      fetchSpace();

      wsRef.current = connectWebSocket(spaceId, user?.token);
      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "space-joined") {
          setUserPosition(message.payload.spawn);
          setUsers(message.payload.users);
        } else if (message.type === "user-join") {
          setUsers((prev) => [
            ...prev,
            {
              userId: message.payload.userId,
              x: message.payload.x,
              y: message.payload.y,
            },
          ]);
        } else if (message.type === "user-left") {
          setUsers((prev) =>
            prev.filter((u) => u.userId !== message.payload.userId)
          );
        } else if (message.type === "movement") {
          setUsers((prev) =>
            prev.map((u) =>
              u.userId === message.payload.userId
                ? { ...u, x: message.payload.x, y: message.payload.y }
                : u
            )
          );
        }
      };

      return () => {
        wsRef.current?.close();
      };
    }
  }, [spaceId, user?.token]);

  useEffect(() => {
    if (spaceId) {
      const canvas = canvasRef.current;
      if (canvas && space) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          space.elements.forEach((element) => {
            const img = new Image();
            img.src = element.element.imageUrl;
            img.onload = () => {
              ctx.drawImage(
                img,
                element.x,
                element.y,
                element.element.width,
                element.element.height
              );
            };
          });
          users.forEach((u) => {
            ctx.fillStyle = "blue";
            ctx.fillRect(u.x, u.y, 10, 10);
          });
          ctx.fillStyle = "red";
          ctx.fillRect(userPosition.x, userPosition.y, 10, 10);
        }
      }
    }
  }, [space, users, userPosition, spaceId]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (spaceId) {
      let newX = userPosition.x;
      let newY = userPosition.y;
      if (e.key === "ArrowUp") newY -= 1;
      if (e.key === "ArrowDown") newY += 1;
      if (e.key === "ArrowLeft") newX -= 1;
      if (e.key === "ArrowRight") newX += 1;

      wsRef.current?.send(
        JSON.stringify({
          type: "move",
          payload: { x: newX, y: newY },
        })
      );
      setUserPosition({ x: newX, y: newY });
    }
  };

  useEffect(() => {
    window.addEventListener(
      "keydown",
      spaceId ? handleKeyDown : handleArenaKeyDown
    );
    return () =>
      window.removeEventListener(
        "keydown",
        spaceId ? handleKeyDown : handleArenaKeyDown
      );
  }, [userPosition, arenaCurrentUser, spaceId]);

  const handleAddElement = async () => {
    if (!user) {
      alert("Guests cannot add elements");
      return;
    }
    const elementId = prompt("Enter element ID");
    const x = Number(prompt("Enter x coordinate"));
    const y = Number(prompt("Enter y coordinate"));
    if (elementId && spaceId) {
      const response = await addElementToSpace(
        spaceId,
        elementId,
        x,
        y,
        user.token
      );
      if (response.status === 200 && space) {
        setSpace({ ...space, elements: [...space.elements, response.data] });
      }
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    if (!user) {
      alert("Guests cannot delete elements");
      return;
    }
    if (spaceId) {
      const response = await deleteElementFromSpace(
        spaceId,
        elementId,
        user.token
      );
      if (response.status === 200 && space) {
        setSpace({
          ...space,
          elements: space.elements.filter((e) => e.id !== elementId),
        });
      }
    }
  };

  // Render Arena when no spaceId is provided
  if (!spaceId) {
    return (
      <div className="p-4" onKeyDown={handleArenaKeyDown} tabIndex={0}>
        <h1 className="text-2xl font-bold mb-4">Arena</h1>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Token: {arenaParams.token}</p>
          <p className="text-sm text-gray-600">
            Space ID: {arenaParams.spaceId}
          </p>
          <p className="text-sm text-gray-600">
            Connected Users: {arenaUsers.size + (arenaCurrentUser ? 1 : 0)}
          </p>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <canvas
            ref={arenaCanvasRef}
            width={2000}
            height={2000}
            className="bg-white"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Use arrow keys to move your avatar
        </p>
      </div>
    );
  }

  // Original SpaceView render when spaceId exists
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Space View</h1>
        <button
          onClick={() =>
            navigate(user?.role === "admin" ? "/admin" : user ? "/user" : "/")
          }
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600 mb-6"
        >
          Back to{" "}
          {user
            ? user.role === "admin"
              ? "Admin Dashboard"
              : "User Dashboard"
            : "Home"}
        </button>
        {user && (
          <button
            onClick={handleAddElement}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-6 ml-4"
          >
            Add Element
          </button>
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-300"
        ></canvas>
        <div className="bg-white p-6 rounded shadow-md mt-6">
          <h2 className="text-xl font-bold mb-4">Elements</h2>
          {space?.elements.map((element) => (
            <div
              key={element.id}
              className="flex justify-between items-center mb-2"
            >
              <span>
                {element.element.imageUrl} ({element.x}, {element.y})
              </span>
              {user && (
                <button
                  onClick={() => handleDeleteElement(element.id)}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpaceView;
