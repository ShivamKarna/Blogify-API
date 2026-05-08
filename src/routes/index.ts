import { Hono } from "hono";
import { blogRouter } from "./blog.routes";

const mainRouter = new Hono();

mainRouter.route("/blog", blogRouter);

export { mainRouter };
