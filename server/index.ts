import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import jobsRouter from "./routes/jobs.js";
import filesRouter from "./routes/files.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(express.json());

app.use("/api/jobs", jobsRouter);
app.use("/api/files", filesRouter);

const staticPath =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

const port = process.env.PORT || 3003;
server.listen(port, () => {
  console.log(`Three Z Job Portal API running on http://localhost:${port}`);
});
