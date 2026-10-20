import { ecsFormat } from "@elastic/ecs-pino-format";
import type { Logger, LoggerOptions } from "pino";
import { pino } from "pino";
import pinoPretty from "pino-pretty"; // 1. Import pino-pretty directly

import { getEnv } from "~/utils/env.utils";

// 2. Wrap pino logger initialization conditionally
let pinoLogger: Logger;

if (getEnv("IS_LOCALHOST") === "true") {
  // Pass the synchronous pinoPretty stream directly as the second argument
  pinoLogger = pino(
      { level: "debug" },
      pinoPretty({ colorize: true })
  );
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
