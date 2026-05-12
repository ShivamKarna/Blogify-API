import { Hono } from "hono";
import { publicBlogRouter, privateBlogRouter } from "./blog.routes";
import { userRouter } from "./user.routes";

const mainRouter = new Hono();

mainRouter.route("/blogs", publicBlogRouter);
mainRouter.route("/blogs", privateBlogRouter);
mainRouter.route("/users", userRouter);

export { mainRouter };
