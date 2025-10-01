import type { outGoingMessageType } from "../types";
import { User } from "./User";

export class Room {
  spaces: Map<string, User[]> = new Map();
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

  removeUser(user: User, spaceId: string) {
    const users = this.spaces.get(spaceId);
    if (!users) {
      return;
    }
    const updateUsers = users.filter((usr) => user.id !== usr.id);
    if (updateUsers.length === 0) {
      this.spaces.delete(spaceId);
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

  public publish(
    message: outGoingMessageType,
    userId: string,
    spaceId: string
  ) {
    if (!this.spaces.get(spaceId)) {
      return;
    }
    this.spaces.get(spaceId)?.forEach((usr) => {
      if (userId !== usr.id) {
        usr.ws.send(JSON.stringify(message));
      }
    });
  }
}
