import { Request, Response, Router } from "express";
import { signinSchema, signupSchema } from "../types";
import client from "@repo/db/client";
import bcrypt from "bcrypt";
import { Role } from "../../../../packages/db/src/generated/prisma";
import jwt from "jsonwebtoken";
import { secretKey, validateUser } from "../middleware";

export const userRoutes = Router();

userRoutes.post("/signup", async (req: Request, res: Response) => {
  const reqBody = req.body;
  const { success, data } = signupSchema.safeParse(reqBody);
  if (!success) {
    return res.status(404).json({
      message: "invalid body",
    });
  }
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await client.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      role: data.type as unknown as Role,
    },
  });

  if (!user) {
    return res.status(500).json({
      message: "error creating user",
    });
  }

  return res.status(200).json({
    userId: user.id,
  });
});

userRoutes.post("/signin", async (req: Request, res: Response) => {
  const reqBody = req.body;
  const { success, data } = signinSchema.safeParse(reqBody);
  if (!success) {
    return res.status(404).json({
      message: "invalid body",
    });
  }
  const user = await client.user.findUnique({
    where: {
      username: data.username,
    },
  });

  if (!user) {
    return res.status(404).json({
      message: "user doesn't exist",
    });
  }

  const isCorrectPassword = bcrypt.compareSync(data.password, user?.password);

  if (!isCorrectPassword) {
    return res.status(404).json({
      message: "wrong password",
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    secretKey,
    { expiresIn: "4h" }
  );

  return res.status(200).json({
    token,
  });
});

userRoutes.get("/elements", validateUser, (req: Request, res: Response) => {
  return res.json({
    message: "fetched all elements",
    elements: [],
  });
});
