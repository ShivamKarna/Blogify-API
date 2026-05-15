import { OpenAPIHono } from "@hono/zod-openapi";
import { publicBlogRouter, privateBlogRouter } from "./blog.routes";
import { userRouter } from "./user.routes";
import { notfiRouter } from "./notification.routes";

const mainRouter = new OpenAPIHono();

mainRouter.route("/blogs", publicBlogRouter);
mainRouter.route("/blogs", privateBlogRouter);
mainRouter.route("/users", userRouter);
mainRouter.route("/notifications", notfiRouter);

export { mainRouter };
