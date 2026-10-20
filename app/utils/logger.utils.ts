import { ecsFormat } from "@elastic/ecs-pino-format";
import type { Logger, LoggerOptions } from "pino";
import { pino } from "pino";

import { getEnv } from "~/utils/env.utils";

let pinoLogger: Logger;

if (getEnv("IS_LOCALHOST") === "true") {
  pinoLogger = pino({
    level: "debug",
    transport: {
      target: import.meta.resolve("pino-pretty"),
      options: { colorize: true },
    },
  });
} else {
  const prodConfig: LoggerOptions = {
    ...ecsFormat(),
    timestamp: false,
    formatters: {
      level: (label) => ({ level: label }),
    },
  };
  pinoLogger = pino(prodConfig);
}

// Logger wrapper to handle server-side and client-side logging.
export const logger = {
  info: (data: unknown) => {
    if (typeof document === "undefined") {
      pinoLogger.info(data);
    } else {
      console.log(data);
    }
  },
  error: (data: unknown) => {
    if (typeof document === "undefined") {
      pinoLogger.error(data);
    } else {
      console.error(data);
    }
  },
  warn: (data: unknown) => {
    if (typeof document === "undefined") {
      pinoLogger.warn(data);
    } else {
      console.warn(data);
    }
  },
};
