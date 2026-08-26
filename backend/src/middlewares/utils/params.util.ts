import { HTTPCodes, MyError } from "../../utils/errorHandling";

export function getUserIdFromParams(
    params: Record<string, string | undefined>,
): number {
    const rawId = params.id;

    if (rawId === undefined || rawId.trim() === "") {
        throw new MyError(
            "user id is required",
            HTTPCodes.BAD_REQUEST,
        );
    }

    const userId = Number(rawId);

    if (!Number.isInteger(userId) || userId <= 0) {
        throw new MyError(
            "user id must be a valid number",
            HTTPCodes.BAD_REQUEST,
        );
    }

    return userId;
}
