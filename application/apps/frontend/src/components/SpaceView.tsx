import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSpace, addElementToSpace, connectWebSocket } from "../api";
import type { User, Space, SpaceViewProps } from "../types/types";
import type { outGoingMessageType } from "../types/wsMessageType";

const SpaceView: React.FC<SpaceViewProps> = ({ user }) => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [space, setSpace] = useState<Space | null>(null);
  const [currentUser, setCurrentUser] = useState<any>({
    x: 5,
    y: 5,
    userId: "local-user",
  });
  const [users, setUsers] = useState(new Map());
  const [currentDirection, setCurrentDirection] = useState<string>("right");
  const [nearbyUsers, setNearbyUsers] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<
    Array<{ userId: string; message: string; timestamp: number }>
  >([]);
  const [messageInput, setMessageInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Grid configuration
  const GRID_SIZE = 40;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PACMAN_RADIUS = 15;

  // Calculate nearby users (within 1 grid cell distance)
  const calculateNearbyUsers = useCallback(() => {
    if (!currentUser || currentUser.x === undefined) return [];

    const nearby: string[] = [];
    users.forEach((otherUser) => {
      if (
        otherUser.userId &&
        otherUser.x !== undefined &&
        otherUser.y !== undefined
      ) {
        const xDiff = Math.abs(currentUser.x - otherUser.x);
        const yDiff = Math.abs(currentUser.y - otherUser.y);

        // Check if within 1 grid cell (including diagonals)
        if (xDiff <= 1 && yDiff <= 1 && !(xDiff === 0 && yDiff === 0)) {
          nearby.push(otherUser.userId);
        }
      }
    });

    return nearby;
  }, [currentUser, users]);

  // Update nearby users whenever position changes
  useEffect(() => {
    const nearby = calculateNearbyUsers();
    setNearbyUsers(nearby);

    // Auto-show chat if there are nearby users
    if (nearby.length > 0 && !showChat) {
      setShowChat(true);
    }
  }, [currentUser, users, calculateNearbyUsers, showChat]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: outGoingMessageType) => {
    switch (message.type) {
      case "space-joined":
        {
          setCurrentUser({
            x: message.payload.spawn.x,
            y: message.payload.spawn.y,
            // userId: message.payload.userId,
          });

          const userMap = new Map();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message.payload.users.forEach((user: any) => {
            userMap.set(user.userId, {
              x: user.x,
              y: user.y,
              userId: user.userId,
              direction: "right",
            });
          });
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

      case "chat-message":
        setChatMessages((prev) => [
          ...prev,
          {
            userId: message.payload.userId,
            message: message.payload.message,
            timestamp: Date.now(),
          },
        ]);
        break;
    }
  }, []);

  const handleMove = useCallback(
    (newX: number, newY: number, direction: string) => {
      if (!currentUser) return;

      setCurrentUser((prev: any) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
      setCurrentDirection(direction);

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

  // Send chat message
  const handleSendMessage = useCallback(() => {
    if (
      !messageInput.trim() ||
      nearbyUsers.length === 0 ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        payload: {
          otherUsers: nearbyUsers,
          message: messageInput.trim(),
        },
      })
    );

    // Add own message to chat
    setChatMessages((prev) => [
      ...prev,
      {
        userId: currentUser.userId || "You",
        message: messageInput.trim(),
        timestamp: Date.now(),
      },
    ]);

    setMessageInput("");
  }, [messageInput, nearbyUsers, currentUser]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!spaceId) return;

    const isDemo = spaceId === "demo";
    const hasToken = !!user?.token;

    if (isDemo || hasToken) {
      const fetchSpace = async () => {
        if (isDemo) {
          // Dummy space for demo
          setSpace({
            id: "demo",
            name: "Demo Space",
            dimensions: "20x15",
            elements: [],
          });
        } else {
          const response = await getSpace(spaceId);
          if (response.status === 200) {
            setSpace(response.data);
          }
        }
      };
      fetchSpace();

      const token = isDemo ? null : user?.token;
      wsRef.current = connectWebSocket(spaceId, token!);

      wsRef.current.onopen = () => {
        wsRef.current?.send(
          JSON.stringify({
            type: "join",
            payload: {
              spaceId,
              token: token,
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

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rows = Math.floor(CANVAS_HEIGHT / GRID_SIZE);
    const cols = Math.floor(CANVAS_WIDTH / GRID_SIZE);

    // Draw chessboard grid
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * GRID_SIZE;
        const y = row * GRID_SIZE;

        if ((row + col) % 2 === 0) {
          ctx.fillStyle = "#f0d9b5";
        } else {
          ctx.fillStyle = "#b58863";
        }
        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

        ctx.strokeStyle = "#8b7355";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
      }
    }

    // Draw space elements
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

    // Highlight nearby users with a glow effect
    users.forEach((user) => {
      if (user.x !== undefined && user.y !== undefined) {
        const isNearby = nearbyUsers.includes(user.userId);

        // Draw glow for nearby users
        if (isNearby) {
          const x = user.x * GRID_SIZE + GRID_SIZE / 2;
          const y = user.y * GRID_SIZE + GRID_SIZE / 2;

          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, PACMAN_RADIUS + 8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(76, 205, 196, 0.3)";
          ctx.fill();
          ctx.restore();
        }

        drawPacman(
          ctx,
          user.x,
          user.y,
          user.direction || "right",
          isNearby ? "#00CED1" : "#4ECDC4",
          `User ${user.userId.substring(0, 6)}`
        );
      }
    });

    // Draw current user
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
  }, [space, users, currentUser, currentDirection, nearbyUsers]);

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

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(0, 0, PACMAN_RADIUS, Math.PI / 6, (11 * Math.PI) / 6);
    ctx.lineTo(0, 0);
    ctx.fill();

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
        } else if (e.key === "Enter" && showChat) {
          handleSendMessage();
          e.preventDefault();
        }

        const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE) - 1;
        const maxY = Math.floor(CANVAS_HEIGHT / GRID_SIZE) - 1;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        if (newX !== currentUser.x || newY !== currentUser.y) {
          handleMove(newX, newY, direction);
        }
      }
    },
    [currentUser, currentDirection, handleMove, showChat, handleSendMessage]
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
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-row justify-between">
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
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-6"
          >
            Add Element
          </button>
        )}

        <div className="flex gap-4">
          <div className="flex-1">
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
                  <span>Other Users</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#00CED1] rounded-full mr-2"></div>
                  <span>Nearby Users</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Connected Users: {users.size + 1}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Position: ({currentUser.x}, {currentUser.y})
              </p>
              <p className="text-sm text-green-600 mt-1">
                Nearby Users: {nearbyUsers.length}
              </p>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Chat</h3>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  {showChat ? "Hide" : "Show"}
                </button>
              </div>

              {showChat && (
                <>
                  {nearbyUsers.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                      Move near other users to chat
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto mb-3 space-y-2 max-h-96">
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded ${
                              msg.userId === currentUser.userId
                                ? "bg-blue-100 ml-4"
                                : "bg-gray-100 mr-4"
                            }`}
                          >
                            <div className="text-xs font-semibold text-gray-600">
                              {msg.userId === currentUser.userId
                                ? "You"
                                : `User ${msg.userId.substring(0, 6)}`}
                            </div>
                            <div className="text-sm">{msg.message}</div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-3">
                        <div className="text-xs text-gray-500 mb-2">
                          Chatting with: {nearbyUsers.length} user(s)
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSendMessage();
                              }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceView;
