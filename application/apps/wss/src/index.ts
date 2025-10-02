import express from "express";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { User } from "./Classes/User";
const app = express();
const server = createServer(app);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (userSocket: WebSocket) => {
  console.log(`user connected`);
  let user = new User(userSocket);
  userSocket.on("error", console.error);

  userSocket.send("something");
  userSocket.on("close", () => {
    user.clearUser();
  });
});

console.log("ws running");
