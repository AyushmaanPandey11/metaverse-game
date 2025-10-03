import { WebSocket } from "ws";
import { wsMessageType } from "../types";
import jwt, { JwtPayload } from "jsonwebtoken";
import client from "@repo/db/client";
import { Room } from "./Room";
export const secretKey = "secretKey";

export class User {
  public ws: WebSocket;
  public id: string;
  private userId?: string;
  private spaceId?: string;
  private x: number;
  private y: number;

  constructor(ws: WebSocket) {
    this.id = this.getRandomId();
    this.x = 0;
    this.y = 0;
    this.ws = ws;
    this.eventsHandler();
  }

  private eventsHandler() {
    this.ws.on("message", async (data) => {
      const parsedData: wsMessageType = JSON.parse(data.toString());
      const roomInstance = Room.getInstance();
      switch (parsedData.type) {
        case "join":
          const { spaceId, token } = parsedData.payload;
          const decoded = jwt.verify(token, secretKey) as JwtPayload;
          const userId = decoded.userId;
          if (!userId) {
            this.ws.close();
            return;
          }
          this.userId = userId;
          const userSpace = await client.space.findFirst({
            where: {
              id: spaceId,
            },
            include: {
              elements: {
                select: {
                  x: true,
                  y: true,
                },
              },
            },
          });
          if (!userSpace) {
            this.ws.close();
            return;
          }
          this.spaceId = spaceId;
          const roomUsers = Room.getInstance().spaces.get(spaceId) ?? [];
          const userCoords = roomUsers.map((user) => ({
            x: user.x,
            y: user.y,
          }));
          const elementsCoords = userSpace.elements.map((ele) => ({
            x: ele.x,
            y: ele.y,
          }));
          const spawnPoint = this.findNewUserCoordinates(
            userSpace.width,
            userSpace.height,
            elementsCoords,
            userCoords
          );
          if (!spawnPoint) {
            this.ws.close();
            return null;
          } else {
            this.x = spawnPoint.x;
            this.y = spawnPoint.y;
          }
          roomInstance.addUser(this, spaceId);
          this.ws.send(
            JSON.stringify({
              type: "space-joined",
              payload: {
                spawn: {
                  x: this.x,
                  y: this.y,
                },
                users:
                  roomInstance.spaces
                    .get(spaceId)
                    ?.filter((u) => u.id !== this.id)
                    ?.map((u) => ({ id: u.userId })) || [],
              },
            })
          );
          roomInstance.publish(
            {
              type: "user-join",
              payload: {
                userId: this.userId!,
                x: this.x,
                y: this.y,
              },
            },
            this.id,
            this.spaceId
          );
          break;

        case "move":
          const { x, y } = parsedData.payload;
          const xDisplacement = Math.abs(this.x - x);
          const yDisplacement = Math.abs(this.y - y);
          if (
            (xDisplacement == 1 && yDisplacement == 0) ||
            (xDisplacement == 0 && yDisplacement == 1)
          ) {
            const userSpace = await client.space.findUnique({
              where: {
                id: this.spaceId,
              },
              include: {
                elements: {
                  where: {
                    element: {
                      static: true,
                    },
                  },
                  include: {
                    element: {
                      select: {
                        height: true,
                        width: true,
                      },
                    },
                  },
                },
              },
            });
            if (!userSpace) {
              this.ws.close();
              return;
            }
            // should be within the space bounds
            if (
              x <= userSpace.width &&
              x >= 0 &&
              y >= 0 &&
              y <= userSpace.height!
            ) {
              const spaceUsers = roomInstance.spaces.get(this.spaceId!);
              const occupiedCoords = new Set<string>();
              userSpace.elements.forEach((e) => {
                const { x: startX, y: startY } = e;
                const { width, height } = e.element;
                for (let i = 0; i < width; i++) {
                  for (let j = 0; j < height; j++) {
                    occupiedCoords.add(`${startX + i},${startY + j}`);
                  }
                }
              });
              spaceUsers?.forEach((u) => occupiedCoords.add(`${u.x},${u.y}`));
              if (!occupiedCoords.has(`${x},${y}`)) {
                this.x = x;
                this.y = y;
                roomInstance.publish(
                  {
                    type: "movement",
                    payload: {
                      x: this.x,
                      y: this.y,
                      userId: this.userId!,
                    },
                  },
                  this.id,
                  this.spaceId!
                );
              } else {
                this.ws.send(
                  JSON.stringify({
                    type: "movement-rejected",
                    payload: {
                      x: this.x,
                      y: this.y,
                    },
                  })
                );
              }
            }
          } else {
            // rejected case, can only take one step either of the axis
            this.ws.send(
              JSON.stringify({
                type: "movement-rejected",
                payload: {
                  x: this.x,
                  y: this.y,
                },
              })
            );
          }
          break;
        default:
          break;
      }
    });
  }

  private findNewUserCoordinates(
    width: number,
    height: number,
    elements: { x: number; y: number }[],
    otherUsers: { x: number; y: number }[]
  ): { x: number; y: number } | null {
    const occupiedCoords = new Set<string>();
    elements.forEach((e) => occupiedCoords.add(`${e.x},${e.y}`));
    otherUsers.forEach((u) => occupiedCoords.add(`${u.x},${u.y}`));

    const maxAttempts = width * height;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const coordKey = `${x},${y}`;
      if (!occupiedCoords.has(coordKey)) {
        return { x, y };
      }
      attempts++;
    }
    return null;
  }

  clearUser() {
    const roomInstance = Room.getInstance();
    roomInstance.removeUser(this, this.spaceId!);
    roomInstance.publish(
      {
        type: "user-left",
        payload: {
          userId: this.userId!,
        },
      },
      this.id,
      this.spaceId!
    );
  }

  private getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
