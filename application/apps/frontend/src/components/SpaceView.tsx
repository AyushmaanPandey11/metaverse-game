import React, { useState, useEffect, useRef, useCallback } from "react";
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
    { userId: string; x: number; y: number; direction: string }[]
  >([]);
  const [currentDirection, setCurrentDirection] = useState<string>("right");
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Grid configuration
  const GRID_SIZE = 40; // Size of each grid cell in pixels
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PACMAN_RADIUS = 15; // Radius of Pacman

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
          setUsers(
            message.payload.users.map((u: any) => ({
              ...u,
              direction: "right",
            }))
          );
        } else if (message.type === "user-join") {
          setUsers((prev) => [
            ...prev,
            {
              userId: message.payload.userId,
              x: message.payload.x,
              y: message.payload.y,
              direction: "right",
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

  // Draw chessboard grid and Pacman users
  useEffect(() => {
    if (spaceId && spaceId !== "demo") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw chessboard grid
          const rows = Math.floor(CANVAS_HEIGHT / GRID_SIZE);
          const cols = Math.floor(CANVAS_WIDTH / GRID_SIZE);

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const x = col * GRID_SIZE;
              const y = row * GRID_SIZE;

              // Chessboard pattern
              if ((row + col) % 2 === 0) {
                ctx.fillStyle = "#f0d9b5"; // Light square
              } else {
                ctx.fillStyle = "#b58863"; // Dark square
              }
              ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

              // Grid lines
              ctx.strokeStyle = "#000";
              ctx.lineWidth = 1;
              ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
            }
          }

          // Draw space elements
          space?.elements.forEach((element) => {
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

          // Draw other users as Pacman
          users.forEach((u) => {
            drawPacman(
              ctx,
              u.x,
              u.y,
              u.direction || "right",
              "#4ECDC4",
              `User ${u.userId}`
            );
          });

          // Draw current user as Pacman
          drawPacman(
            ctx,
            userPosition.x,
            userPosition.y,
            currentDirection,
            "#FFD700",
            "You"
          );
        }
      }
    }
  }, [space, users, userPosition, currentDirection, spaceId]);

  // Function to draw Pacman
  const drawPacman = (
    ctx: CanvasRenderingContext2D,
    gridX: number,
    gridY: number,
    direction: string,
    color: string,
    label: string
  ) => {
    const x = gridX * GRID_SIZE + GRID_SIZE / 2;
    const y = gridY * GRID_SIZE + GRID_SIZE / 2;

    ctx.save();
    ctx.translate(x, y);

    // Rotate based on direction
    switch (direction) {
      case "up":
        ctx.rotate(-Math.PI / 2);
        break;
      case "down":
        ctx.rotate(Math.PI / 2);
        break;
      case "left":
        ctx.rotate(Math.PI);
        break;
      case "right":
      default:
        // No rotation needed for right
        break;
    }

    // Draw Pacman body (open mouth)
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(0, 0, PACMAN_RADIUS, Math.PI / 6, (11 * Math.PI) / 6);
    ctx.lineTo(0, 0);
    ctx.fill();

    // Draw Pacman eye
    ctx.beginPath();
    ctx.fillStyle = "#000";
    ctx.arc(
      PACMAN_RADIUS * 0.3,
      -PACMAN_RADIUS * 0.5,
      PACMAN_RADIUS * 0.2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();

    // Draw user label
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + PACMAN_RADIUS + 20);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (spaceId && spaceId !== "demo") {
        let newX = userPosition.x;
        let newY = userPosition.y;
        let direction = currentDirection;

        if (e.key === "ArrowUp") {
          newY -= 1;
          direction = "up";
        } else if (e.key === "ArrowDown") {
          newY += 1;
          direction = "down";
        } else if (e.key === "ArrowLeft") {
          newX -= 1;
          direction = "left";
        } else if (e.key === "ArrowRight") {
          newX += 1;
          direction = "right";
        }

        // Ensure movement stays within canvas bounds
        const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE) - 1;
        const maxY = Math.floor(CANVAS_HEIGHT / GRID_SIZE) - 1;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        // Update direction
        setCurrentDirection(direction);

        wsRef.current?.send(
          JSON.stringify({
            type: "move",
            payload: { x: newX, y: newY },
          })
        );
        setUserPosition({ x: newX, y: newY });
      }
    },
    [currentDirection, spaceId, userPosition]
  );

  useEffect(() => {
    if (spaceId && spaceId !== "demo") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [userPosition, spaceId, handleKeyDown]);

  const handleAddElement = async () => {
    if (!user) {
      alert("Guests cannot add elements");
      return;
    }
    const elementId = prompt("Enter element ID");
    const x = Number(prompt("Enter x coordinate (grid position)"));
    const y = Number(prompt("Enter y coordinate (grid position)"));
    if (elementId && spaceId) {
      const response = await addElementToSpace(
        spaceId,
        elementId,
        x * GRID_SIZE, // Convert grid position to pixel position
        y * GRID_SIZE, // Convert grid position to pixel position
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

  // If no spaceId, show simple demo view
  if (!spaceId) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Space Demo</h1>
          <p className="text-gray-600">
            No space selected. Please go back and select a space.
          </p>
        </div>
      </div>
    );
  }

  // Original SpaceView render when spaceId exists
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Space View - Chessboard Grid
        </h1>
        <button
          onClick={() => navigate("/")}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600 mb-6"
        >
          Back to Home
        </button>
        {user && (
          <button
            onClick={handleAddElement}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-6 ml-4"
          >
            Add Element
          </button>
        )}

        <div className="border-2 border-gray-400 rounded-lg overflow-hidden shadow-lg">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="bg-white block mx-auto"
          />
        </div>

        <div className="mt-4 p-4 bg-white rounded shadow-md">
          <h3 className="text-lg font-semibold mb-2">Controls</h3>
          <p className="text-sm text-gray-600 mb-2">
            Use arrow keys to move your Pacman around the chessboard grid
          </p>
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#FFD700] rounded-full mr-2"></div>
              <span>You (Gold Pacman)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#4ECDC4] rounded-full mr-2"></div>
              <span>Other Users (Teal Pacman)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow-md mt-6">
          <h2 className="text-xl font-bold mb-4">Space Elements</h2>
          {space?.elements.length ? (
            space.elements.map((element) => (
              <div
                key={element.id}
                className="flex justify-between items-center mb-2 p-2 border-b"
              >
                <span>
                  {element.element.imageUrl} (Grid:{" "}
                  {Math.floor(element.x / GRID_SIZE)},{" "}
                  {Math.floor(element.y / GRID_SIZE)})
                </span>
                {user && (
                  <button
                    onClick={() => handleDeleteElement(element.id)}
                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No elements in this space yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceView;
