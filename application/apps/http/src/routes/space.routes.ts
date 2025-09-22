import { Request, Response, Router } from "express";

export const spaceRoutes = Router();

spaceRoutes.post("/", (req: Request, res: Response) => {
  res.json({
    message: "creating a space",
  });
});

spaceRoutes.delete("/:spaceId", (req: Request, res: Response) => {
  const spaceId = req.params.spaceId;
  res.json({
    message: `deleting space of id : ${spaceId}`,
    id: spaceId,
  });
});

spaceRoutes.get("/:spaceId", (req: Request, res: Response) => {
  const spaceId = req.params.spaceId;
  res.json({
    message: `getting spaceId information of id : ${spaceId}`,
  });
});

spaceRoutes.get("/all", (req: Request, res: Response) => {
  res.json({
    message: "spaces array",
  });
});

spaceRoutes.post("/element", (req: Request, res: Response) => {
  const { elementId, spaceId, x, y } = req.body;
  res.json({
    message: "element added",
    element: {
      elementId,
      spaceId,
      x,
      y,
    },
  });
});
