import { Request, Response, Router } from "express";
import {
  addElementSchema,
  createSpaceSchema,
  deleteSpaceElement,
} from "../types";
import { validateUser } from "../middleware";
import client from "@repo/db/client";
export const spaceRoutes = Router();

spaceRoutes.post("/", validateUser, async (req: Request, res: Response) => {
  const { success, data, error } = createSpaceSchema.safeParse(req.body);
  if (!success) {
    return res.status(404).json({
      message: "invalid body request",
      error,
    });
  }
  // creating new map if mapId is not present
  if (!data.mapId) {
    const result = await client.space.create({
      data: {
        name: data.name,
        creatorId: req.userId!,
        height: parseInt(data.dimensions.split("x")[1]),
        width: parseInt(data.dimensions.split("x")[0]),
      },
    });
    return res.status(200).json({
      spaceId: result.id,
    });
  }

  const map = await client.map.findFirst({
    where: {
      id: data.mapId,
    },
    select: {
      height: true,
      width: true,
      elements: true,
    },
  });
  if (!map) {
    return res.status(404).json({
      message: "map not found",
    });
  }

  const space = await client.$transaction(async () => {
    const newSpace = await client.space.create({
      data: {
        name: data.name,
        creatorId: req.userId!,
        width: map.width,
        height: map.height,
      },
    });
    await client.spaceElements.createMany({
      data: map.elements.map((ele) => ({
        spaceId: newSpace.id,
        elementId: ele.elementId,
        x: ele.x,
        y: ele.y,
      })),
    });
    return newSpace;
  });

  if (!space) {
    return res.status(500).json({
      message: "error creating space",
    });
  }

  res.status(200).json({
    spaceId: space.id,
  });
});

spaceRoutes.delete(
  "/element",
  validateUser,
  async (req: Request, res: Response) => {
    const { success, data, error } = deleteSpaceElement.safeParse(req.body);
    if (!success) {
      return res.status(404).json({
        message: "invalid req params",
        error: error,
      });
    }
    const space = await client.space.findUnique({
      where: {
        id: data.spaceId,
      },
    });

    if (space?.creatorId !== req.userId!) {
      return res.status(401).json({
        message: "only creator can remove element",
      });
    }

    await client.spaceElements.delete({
      where: {
        id: data.elementId,
      },
    });
    return res.status(200).json({ message: "element deleted" });
  }
);

spaceRoutes.delete(
  "/byId/:spaceId",
  validateUser,
  async (req: Request, res: Response) => {
    const spaceId = req.params.spaceId;
    if (!spaceId) {
      return res.status(404).json({
        message: "invalid spaceId",
      });
    }
    const space = await client.space.findUnique({
      where: {
        id: spaceId,
      },
      select: {
        creatorId: true,
      },
    });

    if (!space) {
      res.status(400).json({ message: "Space not found" });
      return;
    }

    if (space.creatorId !== req.userId) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    await client.space.delete({
      where: {
        id: spaceId,
      },
    });

    return res.status(200).json({ message: "space deleted" });
  }
);

spaceRoutes.get("/all", validateUser, async (req: Request, res: Response) => {
  const spaces = await client.space.findMany({
    where: {
      creatorId: req.userId,
    },
  });
  if (spaces.length === 0) {
    return res.status(400).json({
      messasge: "no existing spaces",
      spaces: [],
    });
  }
  return res.status(200).json({
    spaces: spaces.map((sp) => ({
      id: sp.id,
      name: sp.name,
      dimensions: `${sp.width}x${sp.height}`,
      thumbnail: sp.thumbnail,
    })),
  });
});

spaceRoutes.get("/:spaceId", async (req: Request, res: Response) => {
  const spaceId = req.params.spaceId;
  if (!spaceId) {
    return res.status(404).json({
      message: "invalid spaceId",
    });
  }

  const result = await client.space.findUnique({
    where: {
      id: spaceId,
    },
    include: {
      elements: {
        include: {
          element: true,
        },
      },
    },
  });

  if (!result) {
    return res.status(404).json({
      message: "space doesn't exist",
    });
  }

  return res.status(200).json({
    dimensions: `${result.width}x${result.height}`,
    elements: result.elements.map((ele) => ({
      id: ele.id,
      element: {
        id: ele.element.id,
        imageUrl: ele.element.imageUrl,
        static: ele.element.static,
        height: ele.element.height,
        width: ele.element.width,
      },
      x: ele.x,
      y: ele.y,
    })),
  });
});

spaceRoutes.post(
  "/element",
  validateUser,
  async (req: Request, res: Response) => {
    const { success, data, error } = addElementSchema.safeParse(req.body);
    if (!success) {
      return res.status(404).json({
        message: "invalid request body",
        error,
      });
    }

    const existingSpace = await client.space.findUnique({
      where: {
        id: data.spaceId,
      },
      select: {
        height: true,
        width: true,
      },
    });
    if (!existingSpace) {
      return res.status(400).json({ message: "space doesn't exists" });
    }
    const { height, width } = existingSpace;
    if (data.x < 0 || data.y < 0 || data.x > width || data.y > height!) {
      return res
        .status(400)
        .json({ message: "element dimensions are out of bound" });
    }

    await client.spaceElements.create({
      data: {
        x: data.x,
        y: data.y,
        elementId: data.elementId,
        spaceId: data.spaceId,
      },
    });
    return res.status(200).json({
      message: "element added!",
    });
  }
);
