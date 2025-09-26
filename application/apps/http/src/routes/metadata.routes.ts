import { Request, Response, Router } from "express";
import { validateUser } from "../middleware";
import { updateMetadataSchema } from "../types";
import client from "@repo/db/client";
export const metadataRoutes = Router();

metadataRoutes.post("/", validateUser, async (req: Request, res: Response) => {
  const { success, data, error } = updateMetadataSchema.safeParse(req.body);
  if (!success) {
    return res.status(404).json({
      message: "invalid request body",
      error,
    });
  }
  const result = await client.user.update({
    where: {
      id: req.userId,
    },
    data: {
      avatarId: data.avatarId,
    },
  });
  if (result.avatarId !== data.avatarId) {
    return res.status(500).json({
      message: "error from server side",
    });
  }
  return res.status(200).json({
    message: `updating avatar for user with avatarId ${req.body.avatarId}`,
  });
});

metadataRoutes.get("/avatars", async (req: Request, res: Response) => {
  try {
    const result = await client.avatar.findMany();

    return res.status(200).json({
      avatars: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "error fetching avatars from db",
    });
  }
});

metadataRoutes.get("/bulk", async (req: Request, res: Response) => {
  const userIdString = (req.query.ids ?? "[]") as string;
  const userIds = userIdString.slice(1, userIdString?.length - 1).split(",");
  const result = await client.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      avatar: true,
      id: true,
    },
  });

  if (!result) {
    return res.status(500).json({
      message: "error fetching data",
    });
  }

  const returnBody = result.map((row) => ({
    userId: row.id,
    imageUrl: row.avatar?.imageUrl,
  }));

  return res.status(200).json({
    avatars: returnBody,
  });
});
