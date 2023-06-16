import { Application, RequestHandler } from "express";
import http, { Server } from "http";
import Controller from "../controllers/Controller";

export default class AppServer extends Server {
  private app: Application;

  private readonly port: string | number;

  constructor(app: Application, port: string | number) {
    super();
    this.app = app;
    this.port = port;
  }

  public run(): http.Server {
    return this.app.listen(this.port, () => {
      console.log(`The server is running on port ${this.port}`);
    });
  }

  public loadMiddleware(middlewares: Array<RequestHandler>): void {
    middlewares.forEach((middleware) => {
      this.app.use(middleware);
    });
  }

  public loadControllers(controllers: Array<Controller>): void {
    controllers.forEach((controller) => {
      this.app.use(controller.path, controller.setRoutes());
    });
  }
}
