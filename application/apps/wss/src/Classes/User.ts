import { WebSocket } from "ws";
import { wsMessageType } from "../types";
import jwt, { JwtPayload } from "jsonwebtoken";
import client from "@repo/db/src/index";
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
          });
          if (!userSpace) {
            this.ws.close();
            return;
          }
          this.spaceId = spaceId;
          const spaceWithElements = await client.spaceElements.findMany({
            where: {
              spaceId: this.spaceId,
            },
          });
          const roomUsers = Room.getInstance().spaces.get(spaceId) ?? [];
          const userCoords = roomUsers.map((user) => ({
            x: user.x,
            y: user.y,
          }));
          const elementsCoords = spaceWithElements.map((ele) => ({
            x: ele.x,
            y: ele.y,
          }));
          const spawnPoint = this.findNewUserCoordinates(
            userSpace?.width!,
            userSpace?.height!,
            elementsCoords!,
            userCoords
          );
          if (!spawnPoint) {
            this.ws.close();
            return null;
          } else {
            this.x = spawnPoint.x;
            this.y = spawnPoint.y;
          }
          Room.getInstance().addUser(this, spaceId);
          this.ws.send(
            JSON.stringify({
              type: "space-joined",
              payload: {
                spawn: {
                  x: this.x,
                  y: this.y,
                },
                users: Room.getInstance()
                  .spaces.get(spaceId)
                  ?.forEach((u) => u.id !== this.userId),
              },
            })
          );
          Room.getInstance().publish(
            {
              type: "user-join",
              payload: {
                userId: this.userId!,
                x: this.x,
                y: this.y,
              },
            },
            this.userId!,
            this.spaceId
          );
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
    Room.getInstance().removeUser(this, this.spaceId!);
    Room.getInstance().publish(
      {
        type: "user-left",
        payload: {
          userId: this.userId!,
        },
      },
      this.userId!,
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
