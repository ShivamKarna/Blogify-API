import { Hono } from "hono";
import { publicBlogRouter, privateBlogRouter } from "./blog.routes";

const mainRouter = new Hono();

mainRouter.route("/blogs", publicBlogRouter);
mainRouter.route("/blogs", privateBlogRouter);

export { mainRouter };
