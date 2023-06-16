import { NextFunction, Request, Response } from "express";
import Controller, { Methods } from "./Controller";

export default class HealthcheckController extends Controller {
  path = "/";

  routes = [
    {
      path: "/",
      method: Methods.GET,
      handler: this.handleHome.bind(this),
      localMiddleware: []
    },
    {
      path: "/health",
      method: Methods.GET,
      handler: this.handleHealthcheck.bind(this),
      localMiddleware: [],
    },
  ];


  async handleHome(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.sendStatus(200);
  }

  async handleHealthcheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.sendStatus(200);
  }
}
