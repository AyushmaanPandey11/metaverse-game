import { Request, Response, Router } from "express";
import client from "@repo/db/client";
import z from "zod";
export const adminRoutes = Router();

adminRoutes.post("/elements", (req: Request, res: Response) => {
  const reqBody = req.body;
  // const {} =
  res.json({
    message: "added element",
    id: "randomId",
  });
});

adminRoutes.put("/elements/:elementId", (req: Request, res: Response) => {
  const elementId = req.params;
  const { imageUrl } = req.body;
  res.json({
    message: "updated element",
    id: "randomId",
  });
});

adminRoutes.post("/avatar", (req: Request, res: Response) => {
  const { imageUrl, name } = req.body;
  res.json({
    message: "avatar",
    avatarId: "randomId",
  });
});

adminRoutes.post("/map", (req: Request, res: Response) => {
  const { thumbnail, dimensions, name, defaultElements } = req.body;
  res.json({
    message: "map",
    id: "randomId",
  });
});
