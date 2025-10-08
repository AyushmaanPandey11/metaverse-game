import { Request, Response, Router } from "express";
import client from "@repo/db/client";
export const mapRoutes = Router();

mapRoutes.get("/all", async (req: Request, res: Response) => {
  const maps = await client.map.findMany();
  return res.status(200).json({
    maps: maps ?? [],
  });
});
