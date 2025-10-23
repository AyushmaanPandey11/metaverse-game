import type { outGoingMessageType, SpaceCache, SpaceElement } from "../types";
import { User } from "./User";
import client from "@repo/db/client";

export class Room {
  spaces: Map<string, User[]> = new Map();
  private spaceData: Map<string, SpaceCache> = new Map();
  static instance: Room;

  constructor() {
    this.spaces = new Map();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new Room();
    }
    return this.instance;
  }

  public async getSpaceData(spaceId: string): Promise<SpaceCache | null> {
    if (spaceId === "demo") {
      const cache: SpaceCache = {
        width: 20,
        height: 15,
        elements: [],
        occupiedStaticTiles: new Set<string>(),
      };
      this.spaceData.set(spaceId, cache);
      return cache;
    }

    if (this.spaceData.get(spaceId)) {
      return this.spaceData.get(spaceId) as unknown as SpaceCache | null;
    }
    const userSpace = await client.space.findUnique({
      where: {
        id: spaceId,
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
      return null;
    }
    const occupiedStaticTiles = new Set<string>();
    const elementsCache: SpaceElement[] = [];

    userSpace.elements.forEach((e) => {
      const { x: startX, y: startY } = e;
      const { width, height } = e.element;

      // element details for the 'join' spawn logic
      elementsCache.push({ x: startX, y: startY, width, height });

      // Calculate and store every tile occupied by the element
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          occupiedStaticTiles.add(`${startX + i},${startY + j}`);
        }
      }
    });

    const cache: SpaceCache = {
      width: userSpace.width,
      height: userSpace.height,
      elements: elementsCache,
      occupiedStaticTiles: occupiedStaticTiles,
    };
    this.spaceData.set(spaceId, cache);
    return cache;
  }

  removeUser(user: User, spaceId: string) {
    const users = this.spaces.get(spaceId);
    if (!users) {
      return;
    }
    const updateUsers = users.filter((usr) => user.id !== usr.id);
    if (updateUsers.length === 0) {
      this.spaces.delete(spaceId);
      this.spaceData.delete(spaceId);
    } else {
      this.spaces.set(spaceId, updateUsers);
    }
  }

  addUser(user: User, spaceId: string) {
    const users = this.spaces.get(spaceId);
    if (!users) {
      this.spaces.set(spaceId, [user]);
      return;
    }
    const updatedUsers = [...users, user];
    this.spaces.set(spaceId, updatedUsers);
  }

  public publish(message: outGoingMessageType, wsId: string, spaceId: string) {
    if (!this.spaces.get(spaceId)) {
      return;
    }
    this.spaces.get(spaceId)?.forEach((usr) => {
      if (wsId !== usr.id) {
        usr.ws.send(JSON.stringify(message));
      }
    });
  }
}
