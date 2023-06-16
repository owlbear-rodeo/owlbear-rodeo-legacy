import cors, { CorsOptions } from "cors";
import express, { Application, RequestHandler } from "express";
import helmet from "helmet";
import { Server } from "socket.io";
// @ts-ignore
import msgParser from "socket.io-msgpack-parser";
import AppServer from "./entities/AppServer";
import Controller from "./controllers/Controller";
import GameServer from "./entities/GameServer";
import Global from "./entities/Global";
import HealthcheckController from "./controllers/HealthcheckController";
import IceServer from "./entities/IceServer";
import IceServerController from "./controllers/IceServerController";

const app: Application = express();
const port: string | number = Global.CONNECTION_PORT;
const server = new AppServer(app, port);

const whitelist = new RegExp(Global.ORIGIN_WHITELIST);

const io = new Server(server, {
  cookie: false,
  cors: {
    origin: whitelist,
    methods: ["GET", "POST"],
    credentials: true,
  },
  serveClient: false,
  maxHttpBufferSize: 1e7,
  parser: msgParser,
});

const corsConfig: CorsOptions = {
  origin: function (origin: any, callback: any) {
    if (!origin || whitelist.test(origin)) {
      return callback(null, true);
    }
    const msg =
      "The CORS policy for this site does not allow access from the specified Origin.";
    return callback(new Error(msg), false);
  },
};

const iceServer = new IceServer();

const globalMiddleware: Array<RequestHandler> = [helmet(), cors(corsConfig)];

const controllers: Array<Controller> = [
  new HealthcheckController(),
  new IceServerController(iceServer),
];

server.loadMiddleware(globalMiddleware);
server.loadControllers(controllers);
const httpServer = server.run();
const game = new GameServer(io);
game.initaliseSocketServer(httpServer);
game.run();

process.once("SIGTERM", () => {
  console.log("sigterm event");
  server.close(() => {
    console.log("http server closed");
  });

  io.close(() => {
    console.log("socket server closed");
    io.sockets.emit("server shutdown");
  });

  setTimeout(() => {
    process.exit(0);
  }, 3000).unref();
});

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});
