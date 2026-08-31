import Elysia, { t } from "elysia";
import { GendersService } from "./gender.service";
import { logError } from "../../utils/logger";
import { MyError, HTTPCodes } from "../../utils/errorHandling";
import { idValidator, stringValidator } from "../../utils/validator";
import type { CreateGender } from "./gender.schema";
import { adminMiddleware } from "../../middlewares";

export class GenderController {
    private readonly gendersService: GendersService;

    constructor() {
        this.gendersService = new GendersService();
    }

    getRoutes() {
        return new Elysia({
            prefix: "/genders",
        })
            .get("/", async () => {
                try {
                    const res = await this.gendersService.getGenders();
                    return res;
                } catch (e) {
                    logError(e, "getting genders");
                    throw e;
                }
            })
            .use(adminMiddleware)
            .post(
                "/",
                async ({ body }) => {
                    try {
                        const res = await this.gendersService.postGender(body);
                        return res;
                    } catch (e) {
                        logError(e, "getting genders");
                        throw e;
                    }
                },
                {
                    body: t.Object({
                        name: t.String({ minLength: 1 }),
                        code: t.String({ minLength: 1 }),
                    }),
                },
            )
            .get(
                "/:id",
                async ({ params }) => {
                    try {
                        if (!params?.id) {
                            throw new MyError("id is required", HTTPCodes.BAD_REQUEST);
                        }
                        const res = await this.gendersService.getGenderById(Number(params.id));
                        return res;
                    } catch (e) {
                        logError(e, "getting genders");
                        throw e;
                    }
                },
                {
                    params: idValidator,
                },
            )
            .patch(
                "/:id",
                async ({ body, params }) => {
                    try {
                        if (!params?.id) {
                            throw new MyError("id is required", HTTPCodes.BAD_REQUEST);
                        }
                        const res = await this.gendersService.patchGender(
                            Number(params.id),
                            body as CreateGender,
                        );
                        return res;
                    } catch (e) {
                        logError(e, "getting genders");
                        throw e;
                    }
                },
                {
                    body: t.Object({
                        name: t.Optional(stringValidator("name")),
                        code: t.Optional(stringValidator("code")),
                    }),
                    params: idValidator,
                },
            )
            .delete(
                "/:id",
                async ({ params }) => {
                    try {
                        if (!params?.id) {
                            throw new MyError("id is required", HTTPCodes.BAD_REQUEST);
                        }
                        const res = await this.gendersService.deleteGender(Number(params.id));
                        return res;
                    } catch (e) {
                        logError(e, "getting genders");
                        throw e;
                    }
                },
                {
                    params: idValidator,
                },
            );
    }
}
