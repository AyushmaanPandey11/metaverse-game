import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const secretKey = "secretKey";

export const validateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new Error("Authorization token is missing.");
    }

    const secretKey = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secretKey) as JwtPayload;

    if (!decoded.role) {
      return res.status(401).send("User role not found in token.");
    }

    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).send("Invalid token.");
  }
};
