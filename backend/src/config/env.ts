import dotenv from "dotenv";

const result = dotenv.config();

if (result.error) {
    throw new Error(
        `Failed to load .env file: ${result.error.message}`
    );
}

type Environment = "development" | "test" | "production";

type AppEnv = {
    port: number;
    appVersion: number;
    environment: Environment;
};

type DbEnv = {
    url: string;
};

type AdminEnv = {
    email: string;
    password: string;
    name: string;
}

type Env = {
    appConf: Readonly<AppEnv>;
    dbConf: Readonly<DbEnv>;
    adminConf: Readonly<AdminEnv>;
};

function getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}`
        );
    }

    return value;
}

function getNumberEnv(
    name: string,
    options: {
        min?: number;
        max?: number;
        defaultValue?: number;
    } = {}
): number {
    const rawValue = process.env[name]?.trim();

    if (!rawValue) {
        if (options.defaultValue !== undefined) {
            return options.defaultValue;
        }

        throw new Error(`Missing required environment variable: ${name}`);
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
        throw new Error(
            `Environment variable ${name} must be a valid number. Received: "${rawValue}"`
        );
    }

    if (options.min !== undefined && value < options.min) {
        throw new Error(
            `Environment variable ${name} must be >= ${options.min}. Received: ${value}`
        );
    }

    if (options.max !== undefined && value > options.max) {
        throw new Error(
            `Environment variable ${name} must be <= ${options.max}. Received: ${value}`
        );
    }

    return value;
}

function getEnvironment(): Environment {
    const value = getRequiredEnv("ENV");

    const allowedEnvironments: Environment[] = [
        "development",
        "test",
        "production",
    ];

    if (!allowedEnvironments.includes(value as Environment)) {
        throw new Error(
            `Invalid ENV value: "${value}". ` +
            `Expected one of: ${allowedEnvironments.join(", ")}`
        );
    }

    return value as Environment;
}

const appConf: Readonly<AppEnv> = Object.freeze({
    port: getNumberEnv("PORT", {
        min: 1,
        max: 65535,
    }),

    appVersion: getNumberEnv("APP_VERSION", {
        min: 1,
    }),

    environment: getEnvironment(),
});

const dbConf: Readonly<DbEnv> = Object.freeze({
    url: getRequiredEnv("DATABASE_URL"),
});

const adminConf: Readonly<AdminEnv> = Object.freeze({
    name: getRequiredEnv("SUPER_ADMIN_NAME"),
    password: getRequiredEnv("SUPER_ADMIN_PASSWORD"),
    email: getRequiredEnv("SUPER_ADMIN_EMAIL"),

})

export const env: Env = Object.freeze({
    appConf,
    dbConf,
    adminConf
});