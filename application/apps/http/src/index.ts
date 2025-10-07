import express, { Request, Response } from "express";
import { routes } from "./routes/index.routes";
import cors from "cors";
const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/health-check", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Server working properly",
  });
});

app.use("/api/v1", routes);

app.listen(8080, () => {
  console.log(`server listening at port: 8080`);
});
