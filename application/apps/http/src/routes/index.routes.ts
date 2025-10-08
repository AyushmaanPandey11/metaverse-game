import { Router } from "express";
import { userRoutes } from "./user.routes";
import { metadataRoutes } from "./metadata.routes";
import { spaceRoutes } from "./space.routes";
import { adminRoutes } from "./admin.routes";
import { validateAdmin } from "../middleware";
import { mapRoutes } from "./map.routes";

export const routes = Router();

routes.use("/user", userRoutes);
routes.use("/user/metadata", metadataRoutes);
routes.use("/space", spaceRoutes);
routes.use("/map", mapRoutes);
routes.use("/admin", validateAdmin, adminRoutes);
