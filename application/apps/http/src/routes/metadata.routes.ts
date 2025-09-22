import { Request, Response, Router } from "express";

export const metadataRoutes = Router();

metadataRoutes.post("/", (req: Request, res: Response) => {
  res.json({
    message: `updating avatar for user with avatarId ${req.body.avatarId}`,
  });
});

metadataRoutes.get("/avatars", (req: Request, res: Response) => {
  res.json({
    message: "returns all avatars available",
  });
});

metadataRoutes.get("/bulk", (req: Request, res: Response) => {
  const idArray = req.query.ids;
  res.json({
    message: `get room user metadata for ${idArray}`,
  });
});
