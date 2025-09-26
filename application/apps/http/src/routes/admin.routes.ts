import { Request, Response, Router } from "express";
import client from "@repo/db/client";
import {
  createAvatarSchema,
  createElementSchema,
  createMapSchema,
  updateElementSchema,
} from "../types";
export const adminRoutes = Router();

adminRoutes.post("/element", async (req: Request, res: Response) => {
  const { success, data } = createElementSchema.safeParse(req.body);

  if (!success) {
    return res.status(404).json({ message: "invalid parameters" });
  }

  const result = await client.element.create({
    data: {
      height: data.height,
      width: data.width,
      static: data.static,
      imageUrl: data.imageUrl,
    },
  });

  return res.status(200).json({
    id: result.id,
  });
});

adminRoutes.put("/elements/:elementId", async (req: Request, res: Response) => {
  const elementId = req.params as unknown as string;
  const { success, data } = updateElementSchema.safeParse(req.body);
  if (!success) {
    return res.status(404).json({ message: "invalid parameters" });
  }

  try {
    await client.element.update({
      data: {
        imageUrl: data.imageUrl,
      },
      where: {
        id: elementId,
      },
    });

    return res.status(200).json({
      message: "updated element",
    });
  } catch (error) {
    console.error("error: ", error);
    return res.status(500).json({ message: `error: ${error}` });
  }
});

adminRoutes.post("/avatar", async (req: Request, res: Response) => {
  const { success, data, error } = createAvatarSchema.safeParse(req.body);
  if (!success) {
    return res
      .status(404)
      .json({ message: "invalid parameters", error: error });
  }

  const avatar = await client.avatar.create({
    data: {
      imageUrl: data.imageUrl,
      name: data.name,
    },
  });

  return res.status(200).json({
    avatarId: avatar.id,
  });
});

adminRoutes.post("/map", async (req: Request, res: Response) => {
  const { success, data, error } = createMapSchema.safeParse(req.body);
  if (!success) {
    return res
      .status(404)
      .json({ message: "invalid parameters", error: error });
  }

  const map = await client.map.create({
    data: {
      name: data.name,
      width: parseInt(data.dimensions.split("x")[0]),
      height: parseInt(data.dimensions.split("x")[1]),
      thumbnail: data.thumbnail,
      elements: {
        create: data.defaultElements.map((ele) => ({
          x: ele.x,
          elementId: ele.elementId,
          y: ele.y,
        })),
      },
    },
  });

  return res.status(200).json({
    id: map.id,
  });
});
