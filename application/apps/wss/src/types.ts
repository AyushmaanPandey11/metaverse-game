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

export type outGoingMessageType =
  | {
      type: "space-joined";
      payload: {
        spawn: {
          x: number;
          y: number;
        };
        users: [
          {
            id: string;
          },
        ];
      };
    }
  | {
      type: "movement-rejected";
      payload: {
        x: number;
        y: number;
      };
    }
  | {
      type: "movement";
      payload: {
        x: number;
        y: number;
        userId: string;
      };
    }
  | {
      type: "user-left";
      payload: {
        userId: string;
      };
    }
  | {
      type: "user-join";
      payload: {
        userId: string;
        x: number;
        y: number;
      };
    };

export interface SpaceElement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpaceCache {
  width: number;
  height: number;
  elements: SpaceElement[];
  occupiedStaticTiles: Set<string>;
}
