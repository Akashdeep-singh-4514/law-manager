import { hashPassword } from "../../utils/bcrypt";
import { UsersRepository } from "./users.repository";
import type { PublicUser, User } from "./users.schema";
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
    async postUser(user: User): Promise<PublicUser| null> {
        const password=await hashPassword(user.password)
        const newUser={...user , password}
        const result= await this.usersRepository.create(newUser)
        return result
    }
}