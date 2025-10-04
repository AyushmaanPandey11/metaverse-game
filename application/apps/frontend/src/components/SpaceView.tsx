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

  useEffect(() => {
    const fetchSpace = async () => {
      if (spaceId) {
        const response = await getSpace(spaceId);
        if (response.status === 200) {
          setSpace(response.data);
        }
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
  }, [spaceId, user?.token]);

  useEffect(() => {
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
  }, [space, users, userPosition]);

  const handleKeyDown = (e: KeyboardEvent) => {
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
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userPosition]);

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
