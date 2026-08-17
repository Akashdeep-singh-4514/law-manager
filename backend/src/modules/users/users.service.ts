import { hashPassword } from "../../utils/bcrypt";
import { ErrorCodes, MyError } from "../../utils/errorHandling";
import { UsersRepository } from "./users.repository";
import type { CreateUser, PublicUser } from "./users.schema";
import { NotFoundError } from "elysia";

export class UsersService {
    private readonly usersRepository: UsersRepository;
    
    constructor() {
        this.usersRepository = new UsersRepository();
    }

    async getUsers() {
        const result= await this.usersRepository.findAll();
        return result
    }
    
    async getUserById(id: number) {
        const result= await this.usersRepository.findById(id);
        if (!result) {
            throw new NotFoundError(`user with id ${id} not found`)
        }
        return result
    }

    async postUser(user: CreateUser): Promise<PublicUser| null> {
        const password=await hashPassword(user.password)
        const newUser={...user , password}
        if (await this.usersRepository.findByEmail(user.email)) {
            throw (new MyError("email already exists").toResponse(ErrorCodes.CONFLICT))
        }
        if (await this.usersRepository.findByMobile(user.dialCode,user.mobile)) {
            throw (new MyError("mobile number already exists").toResponse(ErrorCodes.CONFLICT))
        }
        const result= await this.usersRepository.create(newUser)
        return result
    }
}