import { Request, Response, Router } from "express";

export const userRoutes = Router();

userRoutes.post("/signup", (req: Request, res: Response) => {
  res.json({
    message: "signup",
  });
});

userRoutes.post("/signin", (req: Request, res: Response) => {
  res.json({
    message: "signin",
  });
});

userRoutes.get("/elements", (req: Request, res: Response) => {
  return res.json({
    message: "fetched all elements",
    elements: [],
  });
});
