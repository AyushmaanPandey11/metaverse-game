import "express";

declare module "express" {
  interface Request {
    role?: string;
    userId?: string;
  }
}
