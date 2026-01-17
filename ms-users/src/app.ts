import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

import { requestIdMiddleware } from "./middlewares/request-id.middleware";

dotenv.config();

const app: Application = express();

// Swagger setup
const swaggerDocument = require("../openapi.json");

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api-docs")) {
    next();
  } else {
    helmet()(req, res, next);
  }
});
app.use(cors());
app.use(requestIdMiddleware);
morgan.token("id", (req: Request) => (req.headers["x-request-id"] as string) || "-");
app.use(morgan(':id :method :url :status :res[content-length] - :response-time ms'));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
