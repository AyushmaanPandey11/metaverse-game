export const JOIN = "join";
export const MOVE = "move";

export type wsMessageType =
  | {
      type: "join";
      payload: {
        spaceId: string;
        token: string;
      };
    }
  | {
      type: "move";
      payload: {
        x: number;
        y: number;
      };
    };
