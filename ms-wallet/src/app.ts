import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import transactionRoutes from "./routes/transaction.routes";
import internalRoutes from "./routes/internal.routes";

import { requestIdMiddleware } from "./middlewares/request-id.middleware";

dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(requestIdMiddleware);
morgan.token("id", (req: Request) => (req.headers["x-request-id"] as string) || "-");
app.use(morgan(':id :method :url :status :res[content-length] - :response-time ms'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", transactionRoutes);
app.use("/internal", internalRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
