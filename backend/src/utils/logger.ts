import { initializeLogger, logger,error } from "@rasla/logify";


initializeLogger({
    level: "debug",
    console: true,
    file: true,
    filePath: "./logs/app.log",
});
export function logError(e: unknown){
    error(e instanceof Error ? e.message : String(e));
}

export { logger }