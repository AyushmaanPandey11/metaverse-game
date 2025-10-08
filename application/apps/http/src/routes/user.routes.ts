import { Request, Response, Router } from "express";
import { signinSchema, signupSchema } from "../types";
import client from "@repo/db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { secretKey, validateUser } from "../middleware";

export const userRoutes = Router();

userRoutes.post("/signup", async (req: Request, res: Response) => {
  const reqBody = req.body;
  const { success, data, error } = signupSchema.safeParse(reqBody);
  if (!success) {
    return res.status(404).json({
      message: "invalid body",
      error: error.message,
    });
  }
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await client.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      role: data.role === "admin" ? "Admin" : "User",
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
  const { success, data, error } = signinSchema.safeParse(reqBody);
  if (!success) {
    return res.status(404).json({
      message: "invalid body",
      error: error.message,
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
      userId: user.id,
      role: user.role,
    },
    secretKey,
    { expiresIn: "4h" }
  );

  return res.status(200).json({
    token,
    role: user.role,
  });
});

userRoutes.get(
  "/elements",
  validateUser,
  async (req: Request, res: Response) => {
    const fetchData = await client.element.findMany();
    if (!fetchData) {
      return res.status(500).json({
        message: "error from fetching element",
      });
    }
    return res.json({
      message: "fetched all elements",
      elements: fetchData,
    });
  }
);
