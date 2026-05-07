import { createFactory } from "hono/factory";
import type { BindingsType, Variables } from "./types";

export const factory = createFactory<{
  Bindings: BindingsType;
  Variables: Variables;
}>();
