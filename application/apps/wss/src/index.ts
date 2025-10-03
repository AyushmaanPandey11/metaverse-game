import express from "express";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { User } from "./Classes/User";
const app = express();
const port = 3001;
const server = createServer(app);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (userSocket: WebSocket) => {
  console.log(`user connected`);
  let user = new User(userSocket);
  userSocket.on("error", console.error);
  userSocket.on("close", () => {
    user.clearUser();
  });
});

server.listen(port, () => {
  console.log(`HTTP and WebSocket server running on port ${port}`);
});
