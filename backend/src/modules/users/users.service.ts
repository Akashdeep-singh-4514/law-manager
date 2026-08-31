import { comparePassword, hashPassword } from "../../utils/bcrypt";
import { HTTPCodes, MyError } from "../../utils/errorHandling";
import type { AccessTokenPayload } from "../../utils/jwt";
import { GendersService } from "../genders/gender.service";
import { UsersRepository } from "./users.repository";
import {
    UserRoles,
    type CreateUser,
    type PublicUser,
    type UpdatePassword,
    type UpdateUser,
} from "./users.schema";
import { NotFoundError } from "elysia";

export class UsersService {
    private readonly usersRepository: UsersRepository;
    private readonly gendersService: GendersService;

    constructor() {
      this.usersRepository = new UsersRepository();
      this.gendersService = new GendersService();
    }

    async getUsers() {
        const result = await this.usersRepository.findAll();
        return result;
    }

    async getUserById(id: number) {
        const result = await this.usersRepository.findById(id);
        if (!result) {
            throw new NotFoundError(`user with id ${id} not found`);
        }
        return result;
    }

    async postUser(user: CreateUser, role?: UserRoles): Promise<PublicUser | null> {
        const password = await hashPassword(user.password);
        const gender = await this.gendersService.getGenderById(Number(user?.genderId));
        if (!gender) {
            throw new MyError("cannot find gender");
        }
        const newUser = {
            name: user.name,
            email: user.email,
            dialCode: user.dialCode,
            mobile: user.mobile,
            password: password,
            gender,
            role: role ?? UserRoles.USER,
        };
        if (await this.usersRepository.findByEmail(user.email)) {
            throw new MyError("email already exists", HTTPCodes.CONFLICT);
        }
        if (await this.usersRepository.findByMobile(user.dialCode, user.mobile)) {
            throw new MyError("mobile number already exists", HTTPCodes.CONFLICT);
        }
        const result = await this.usersRepository.create(newUser);
        return result;
    }

    async patchUser(id: number, user: UpdateUser): Promise<PublicUser | null> {
        if (Object.keys(user).length === 0) {
            throw new MyError("Nothing to update", HTTPCodes.BAD_REQUEST);
        }
        if (user.password) {
            throw new MyError("password cannot be updated by", HTTPCodes.BAD_REQUEST);
        }
        const existingUser = await this.usersRepository.findById(id);

        if (!existingUser) {
            throw new NotFoundError(`user with id ${id} not found`);
        }

        if (user.email && user.email !== existingUser.email) {
            const emailExists = await this.usersRepository.findByEmail(user.email);

            if (emailExists && emailExists.id !== id) {
                throw new MyError("email already exists", HTTPCodes.CONFLICT);
            }
        }
        const dialCode = user.dialCode?.toString() ?? existingUser?.dialCode?.toString();

        const mobile = user.mobile?.toString() ?? existingUser?.mobile?.toString();

        if (mobile && dialCode) {
            const mobileExists = await this.usersRepository.findByMobile(dialCode, mobile);

            if (mobileExists && mobileExists.id !== id) {
                throw new MyError("mobile number already exists", HTTPCodes.CONFLICT);
            }
        }

      const gender = await this.gendersService.getGenderById(Number(user?.genderId));
        if (!gender) {
            throw new MyError("cannot find gender");
        }
        const updateData = {
            name: user.name,
            email: user.email,
            dialCode: user.dialCode,
            mobile: user.mobile,
            isActive: user.isActive,
            gender,
        };

        return await this.usersRepository.update(id, updateData);
    }

    async updatePassword(
        id: number,
        data: UpdatePassword,
        user: AccessTokenPayload,
    ): Promise<PublicUser | null> {
        const existingUser = await this.usersRepository.findByIdUnsafe(id);
        if (!existingUser) {
            throw new MyError("user not found", HTTPCodes.NOT_FOUND);
        }
        if (user.role === UserRoles.USER) {
            const oldPassword = data.oldPassword;
            const matched = await comparePassword(existingUser?.password, oldPassword);
            if (!matched) {
                throw new MyError("invalid credential", HTTPCodes.UNAUTHORIZED);
            }
        }
        const password = await hashPassword(data.password);

        return await this.usersRepository.update(id, { password: password });
    }

    async deleteUser(id: number) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new MyError(`user with id ${id} not found`, HTTPCodes.NOT_FOUND);
        }
        const res = await this.usersRepository.delete(id);
        return res;
    }

    async getUserByEmailUnsafe(email: string) {
        const user = await this.usersRepository.findByEmailUnsafe(email);
        if (!user) {
            throw new MyError(`user  not found`, HTTPCodes.NOT_FOUND);
        }
        return user;
    }

    async getUserByPhoneUnsafe(dialcode: string, mobile: string) {
        const user = await this.usersRepository.findByPhoneUnsafe(dialcode, mobile);
        if (!user) {
            throw new MyError(`user  not found`, HTTPCodes.NOT_FOUND);
        }
        return user;
    }

    async changeRole(id: number, body: { role: UserRoles }) {
        return await this.usersRepository.update(id, { role: body.role });
    }
}
