import { UsersRepository } from "./users.repository";

export class UsersService {
    private readonly usersRepository: UsersRepository;

    constructor() {
        this.usersRepository = new UsersRepository();
    }

    async getUsers() {
        return this.usersRepository.findAll();
    }

    async getUserById(id: number) {
        return this.usersRepository.findById(id);
    }
}