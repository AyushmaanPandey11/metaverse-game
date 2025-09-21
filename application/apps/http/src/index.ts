import express, { Request, Response } from "express";
import { routes } from "./routes/index.routes";

const app = express();
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
