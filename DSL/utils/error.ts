const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  teal: "\x1b[36m",
};

const prefix = `${colors.green}[${colors.yellow}Bot${colors.red}Forge${colors.green}]${colors.reset}`;

// Extend the built-in Error interface for better TypeScript support
interface FormattedError extends Error {
  rawMessage?: string;
}

export function logErr(message: string | Symbol): void {
  const err: FormattedError = new Error(
    `${prefix} Blocked access to restricted property: ${colors.teal}"${String(
      message
    )}"${colors.reset}`
  );

  err.rawMessage = String(message);

  if (err.stack) {
    const lines = err.stack.split("\n");
    err.stack = [lines[0], ...lines.slice(2)].join("\n");
  }

  throw err;
}
