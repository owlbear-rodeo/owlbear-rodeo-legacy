import { NextFunction, Request, Response } from "express";
import IceServer from "../entities/IceServer";
import Controller, { Methods } from "./Controller";

export default class IceServerController extends Controller {
  iceServer: IceServer;

  path = "/";

  routes = [
    {
      path: "/iceservers",
      method: Methods.GET,
      handler: this.handleIceServerConnection.bind(this),
      localMiddleware: [],
    },
  ];

  constructor(iceServer: IceServer) {
    super();
    this.iceServer = iceServer;
  }

  async handleIceServerConnection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const servers = await this.iceServer.getIceServers();
      res.send(JSON.stringify(servers));
    } catch (error) {
      res.status(500).send({ error });
    }
  }
}
