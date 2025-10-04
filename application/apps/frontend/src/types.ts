export interface User {
  token: string;
  role: "user" | "admin";
}

export interface Space {
  id: string;
  name: string;
  dimensions: string;
  elements: SpaceElement[];
}

export interface SpaceElement {
  id: string;
  element: {
    id: string;
    imageUrl: string;
    width: number;
    height: number;
    static: boolean;
  };
  x: number;
  y: number;
}

export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Element {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  static: boolean;
}

export interface Map {
  id: string;
  name: string;
  thumbnail: string;
  dimensions: string;
  defaultElements: { elementId: string; x: number; y: number }[];
}
