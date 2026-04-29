import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import helpRoutes from "./routes/help.js";
import infoRoutes from "./routes/info.js";
import accountRoutes from "./routes/accounts.js";
import poRoutes from "./routes/paymentOrders.js";
import utilityRoutes from "./routes/utility.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api", helpRoutes);
app.use("/api", infoRoutes);
app.use("/api", accountRoutes);
app.use("/api", poRoutes);
app.use("/api", utilityRoutes);

app.use(express.static(publicDir));
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PingFin app running on http://0.0.0.0:${PORT}`);
});
