import express from "express";
import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
const app = express();
const server = createServer(app);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (userSocket: WebSocket) => {
  console.log(`user connected`);
  userSocket.on("error", console.error);

  userSocket.on("message", function message(data, isBinary) {
    console.log("received: %s", data);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  userSocket.send("something");
});
