import express from "express";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import type { wsMessageType } from "./types";
const app = express();
const server = createServer(app);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (userSocket: WebSocket) => {
  console.log(`user connected`);
  userSocket.on("error", console.error);

  userSocket.on("message", function message(data: string) {
    console.log("received: %s", data);
    const parsedMessage: wsMessageType = JSON.parse(data);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  userSocket.send("something");
});

console.log("ws running");
