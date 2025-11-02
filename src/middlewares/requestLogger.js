import { logger } from "../config/logger.js";

export const requestLogger = (req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
};
