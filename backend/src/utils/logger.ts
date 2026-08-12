import { initializeLogger, logger } from "@rasla/logify";


initializeLogger({
    level: "debug",
    console: true,
    file: true,
    filePath: "./logs/app.log",
});

export { logger }