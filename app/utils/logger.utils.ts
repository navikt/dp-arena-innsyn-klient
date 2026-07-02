import { ecsFormat } from "@elastic/ecs-pino-format";
import type { Logger, LoggerOptions } from "pino";
import { pino } from "pino";

import { getEnv } from "~/utils/env.utils";

const devConfig: LoggerOptions = {
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
};

const prodConfig: LoggerOptions = {
  ...ecsFormat(),
  timestamp: false,
  formatters: {
    level: (label) => ({ level: label }),
  },
};

const pinoLogger: Logger = pino(getEnv("IS_LOCALHOST") === "true" ? devConfig : prodConfig);

// Logger wrapper to handle server-side and client-side logging. Console.log is needed client-side for faro auto capture to function properly
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
