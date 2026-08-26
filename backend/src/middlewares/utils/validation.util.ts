export type ValidationIssue = {
    path: string;
    message: string;
    summary?: string;
    schema?: Record<string, unknown>;
};

export type ValidationError = {
    all?: ValidationIssue[];
};

export function humanizeValidationMessage(
    field: string,
    error: ValidationIssue,
): string {
    const schema = error.schema ?? {};

    if (error.summary?.includes("found: undefined")) {
        return `${field} is required`;
    }

    if (schema.format === "email") {
        return `${field} must be a valid email address`;
    }

    if (typeof schema.pattern === "string") {
        return `${field} format is invalid`;
    }

    if (
        typeof schema.minLength === "number" &&
        typeof schema.maxLength === "number"
    ) {
        return `${field} must be ${schema.minLength}-${schema.maxLength} characters long`;
    }

    if (typeof schema.maxLength === "number") {
        return `${field} must be at most ${schema.maxLength} characters long`;
    }

    if (typeof schema.minLength === "number") {
        return `${field} must be at least ${schema.minLength} characters long`;
    }

    return error.message || `${field} is invalid`;
}
