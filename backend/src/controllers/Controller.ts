import { Response, Request, NextFunction, Router } from "express";

export enum Methods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

interface IRoute {
  path: string;
  method: Methods;
  handler: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void | Promise<void>;
  localMiddleware: ((
    req: Request,
    res: Response,
    next: NextFunction
  ) => void)[];
}

export default abstract class Controller {
  public router: Router = Router();
  public abstract path: string;
  protected routes: Array<IRoute> = [];

  public setRoutes = (): Router => {
    for (const route of this.routes) {
      for (const mw of route.localMiddleware) {
        this.router.use(route.path, mw);
      }
      switch (route.method) {
        case "GET":
          this.router.get(route.path, route.handler);
          break;
        case "POST":
          this.router.post(route.path, route.handler);
          break;
        case "PUT":
          this.router.put(route.path, route.handler);
          break;
        case "DELETE":
          this.router.delete(route.path, route.handler);
          break;
        default:
          console.log("not a valid method");
          break;
      }
    }

    return this.router;
  };
}
