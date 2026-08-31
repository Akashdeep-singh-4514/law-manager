import { NotFoundError } from "elysia";
import { GendersRepository } from "./gender.repository";
import type { CreateGender, Gender } from "./gender.schema";
import { HTTPCodes, MyError } from "../../utils/errorHandling";

export class GendersService {
    private readonly gendersRepository: GendersRepository;

    constructor() {
        this.gendersRepository = new GendersRepository();
    }

    async getGenders() {
        const result = await this.gendersRepository.findAll();
        return result;
    }

    async getGenderById(id: number) {
        const result = await this.gendersRepository.findById(id);
        if (!result) {
            throw new NotFoundError(`gender with id ${id} not found`);
        }
        return result;
    }

    async postGender(gender: CreateGender): Promise<Gender | null> {

        const newGender = {
            name: gender.name,
            code: gender.code
        };
        if (await this.gendersRepository.findByCode(gender.code)) {
            throw new MyError("code already exists", HTTPCodes.CONFLICT);
        }
        const result = await this.gendersRepository.create(newGender);
        return result;
    }

    async patchGender(id: number, gender: CreateGender): Promise<Gender | null> {
        if (Object.keys(gender).length === 0) {
            throw new MyError("Nothing to update", HTTPCodes.BAD_REQUEST);
        }
      const existing =await this.gendersRepository.findByCode(gender.code)
        if (existing && id!=existing.id) {
            throw new MyError("code already exists", HTTPCodes.CONFLICT);
        }

        const updateData = {
            name: gender.name??existing?.name,
            code: gender.code??existing?.code,
        };

        return await this.gendersRepository.update(id, updateData);
    }

    async deleteGender(id: number) {
        const gender = await this.gendersRepository.findById(id);
        if (!gender) {
            throw new MyError(`gender with id ${id} not found`, HTTPCodes.NOT_FOUND);
        }
        const res = await this.gendersRepository.delete(id);
        return res;
    }

}
