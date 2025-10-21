import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSpace, addElementToSpace, connectWebSocket } from "../api";
import type { User, Space, SpaceViewProps } from "../types/types";
import type { outGoingMessageType } from "../types/wsMessageType";

const SpaceView: React.FC<SpaceViewProps> = ({ user }) => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [space, setSpace] = useState<Space | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>({
    x: 5,
    y: 5,
    userId: "local-user",
  });
  const [users, setUsers] = useState(new Map());
  const [currentDirection, setCurrentDirection] = useState<string>("right");
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Grid configuration
  const GRID_SIZE = 40;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PACMAN_RADIUS = 15;

  // WebSocket message handler using Arena logic
  const handleWebSocketMessage = useCallback((message: outGoingMessageType) => {
    switch (message.type) {
      case "space-joined":
        {
          setCurrentUser({
            x: message.payload.spawn.x,
            y: message.payload.spawn.y,
          });

          const userMap = new Map();
          message.payload.users.forEach(
            (user: { userId: string; x: number; y: number }) => {
              userMap.set(user.userId, {
                x: user.x,
                y: user.y,
                userId: user.userId,
                direction: "right",
              });
            }
          );
          setUsers(userMap);
        }
        break;

      case "user-join":
        setUsers((prev) => {
          const newUsers = new Map(prev);
          newUsers.set(message.payload.userId, {
            x: message.payload.x,
            y: message.payload.y,
            userId: message.payload.userId,
            direction: "right",
          });
          return newUsers;
        });
        break;

      case "movement":
        setUsers((prev) => {
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
        setCurrentUser((prev: User) => ({
          ...prev,
          x: message.payload.x,
          y: message.payload.y,
        }));
        break;

      case "user-left":
        setUsers((prev) => {
          const newUsers = new Map(prev);
          newUsers.delete(message.payload.userId);
          return newUsers;
        });
        break;
    }
  }, []);

  const handleMove = useCallback(
    (newX: number, newY: number, direction: string) => {
      if (!currentUser) return;

      // Update local position immediately for smooth movement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCurrentUser((prev: any) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
      setCurrentDirection(direction);

      // Send to WebSocket if available
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "move",
            payload: {
              x: newX,
              y: newY,
              userId: currentUser.userId,
            },
          })
        );
      }
    },
    [currentUser]
  );

  // Initialize WebSocket connection and handle space data
  useEffect(() => {
    if (spaceId && spaceId !== "demo" && user?.token) {
      const fetchSpace = async () => {
        const response = await getSpace(spaceId);
        if (response.status === 200) {
          setSpace(response.data);
        }
      };
      fetchSpace();

      wsRef.current = connectWebSocket(spaceId, user.token);

      wsRef.current.onopen = () => {
        wsRef.current?.send(
          JSON.stringify({
            type: "join",
            payload: {
              spaceId,
              token: user.token,
            },
          })
        );
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [spaceId, user?.token, handleWebSocketMessage]);

  // Draw the chessboard grid and users
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
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
          ctx.fillStyle = "#f0d9b5";
        } else {
          ctx.fillStyle = "#b58863";
        }
        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

        // Grid lines
        ctx.strokeStyle = "#8b7355";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
      }
    }

    // Draw space elements if available
    if (space?.elements) {
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
    }

    // Draw other users as Pacman
    users.forEach((user) => {
      if (user.x !== undefined && user.y !== undefined) {
        drawPacman(
          ctx,
          user.x,
          user.y,
          user.direction || "right",
          "#4ECDC4",
          `User ${user.userId.substring(0, 6)}`
        );
      }
    });

    // Draw current user as Pacman
    if (
      currentUser &&
      currentUser.x !== undefined &&
      currentUser.y !== undefined
    ) {
      drawPacman(
        ctx,
        currentUser.x,
        currentUser.y,
        currentDirection,
        "#FFD700",
        "You"
      );
    }
  }, [space, users, currentUser, currentDirection]);

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
        break;
    }

    // Draw Pacman body
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
      if (currentUser && currentUser.x !== undefined) {
        let newX = currentUser.x;
        let newY = currentUser.y;
        let direction = currentDirection;

        if (e.key === "ArrowUp") {
          newY -= 1;
          direction = "up";
          e.preventDefault();
        } else if (e.key === "ArrowDown") {
          newY += 1;
          direction = "down";
          e.preventDefault();
        } else if (e.key === "ArrowLeft") {
          newX -= 1;
          direction = "left";
          e.preventDefault();
        } else if (e.key === "ArrowRight") {
          newX += 1;
          direction = "right";
          e.preventDefault();
        }

        // Ensure movement stays within canvas bounds
        const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE) - 1;
        const maxY = Math.floor(CANVAS_HEIGHT / GRID_SIZE) - 1;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        if (newX !== currentUser.x || newY !== currentUser.y) {
          handleMove(newX, newY, direction);
        }
      }
    },
    [currentUser, currentDirection, handleMove]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
        x * GRID_SIZE,
        y * GRID_SIZE,
        user.token
      );
      if (response.status === 200 && space) {
        setSpace({ ...space, elements: [...space.elements, response.data] });
      }
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-row justify-between ">
          <h1 className="text-3xl font-bold mb-6">
            Space View - Chessboard Grid
          </h1>
          <button
            onClick={() => navigate("/")}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 mb-6"
          >
            Back to Home
          </button>
        </div>
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
          <p className="text-sm text-gray-600 mt-2">
            Connected Users: {users.size + 1}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Position: ({currentUser.x}, {currentUser.y})
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpaceView;
