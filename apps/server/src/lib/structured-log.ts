const LOG_LEVEL_PRIORITY = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
} as const;

type StructuredLogLevel = keyof typeof LOG_LEVEL_PRIORITY;

type StructuredLogger = {
  debug: (msg: string, context?: Record<string, unknown>) => void;
  error: (msg: string, context?: Record<string, unknown>) => void;
  info: (msg: string, context?: Record<string, unknown>) => void;
  warn: (msg: string, context?: Record<string, unknown>) => void;
};

function shouldLog(current: StructuredLogLevel, target: StructuredLogLevel): boolean {
  return LOG_LEVEL_PRIORITY[target] >= LOG_LEVEL_PRIORITY[current];
}

function serializeError(error: unknown): Record<string, unknown> | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  return {
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack
  };
}

export function createStructuredLogger(
  component: string,
  level: StructuredLogLevel
): StructuredLogger {
  const write =
    (targetLevel: StructuredLogLevel) =>
    (msg: string, context: Record<string, unknown> = {}) => {
      if (!shouldLog(level, targetLevel)) {
        return;
      }

      const payload = {
        component,
        level: targetLevel,
        msg,
        timestamp: new Date().toISOString(),
        ...context
      };

      const line = JSON.stringify(payload);

      if (targetLevel === "error") {
        console.error(line);
        return;
      }

      console.log(line);
    };

  return {
    debug: write("debug"),
    error: (msg, context = {}) => {
      write("error")(msg, {
        ...context,
        ...serializeError(context.error)
      });
    },
    info: write("info"),
    warn: write("warn")
  };
}
