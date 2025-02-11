import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import multer from "multer";
import colors from "colors";
import express from "express";
import logger from "#configs/logger";
import routeMapper from "#routes/index";
import rateLimit from "express-rate-limit";
import globalErrorHandler from "#utils/error";
import queryHandler from "#middlewares/queryHandler";
import sessionMiddleware from "#middlewares/session";
import bodyParseMiddleware from "#middlewares/bodyParse";

const server = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

server.use((req, res, next) => {
  const startTime = process.hrtime();
  res.on("finish", () => {
    const fetchStatus = () => {
      if (res.statusCode >= 500) return colors.red(`${res.statusCode}`);
      else if (res.statusCode >= 400) return colors.yellow(`${res.statusCode}`);
      else if (res.statusCode >= 300) return colors.cyan(`${res.statusCode}`);
      else if (res.statusCode >= 200) return colors.green(`${res.statusCode}`);
      else return colors.white(`${res.statusCode}`);
    };
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    logger.info(
      `${"METHOD:".blue} ${req.method.yellow} - ${"URL:".blue} ${
        req.originalUrl.yellow
      } - ${"STATUS:".blue} ${fetchStatus()} - ${"Response Time:".blue} ${
        responseTime.magenta
      } ${"ms".magenta}`
    );
  });
  next();
});
const uploadsDir = path.join(__dirname, "../uploads");

const limiter = rateLimit({
  windowMs: 30 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
});

server.use(limiter);
server.use(cors());
server.use("/uploads", express.static(uploadsDir));
server.use(multer().any());
server.use(express.json());
server.use(bodyParseMiddleware);
server.use(sessionMiddleware);
server.use(queryHandler);
server.use("/api", routeMapper);
server.use(globalErrorHandler);

export default server;
