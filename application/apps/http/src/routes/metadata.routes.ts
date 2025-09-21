import { Request, Response, Router } from "express";

export const metadataRoutes = Router();

metadataRoutes.post("/signup", (req: Request, res: Response) => {
  res.json({
    message: "signup",
  });
});

metadataRoutes.post("/signin", (req: Request, res: Response) => {
  res.json({
    message: "signin",
  });
});
