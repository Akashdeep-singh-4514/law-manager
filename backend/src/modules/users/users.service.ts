export class UsersService {
    getUsers(): any {
        return {data:[]}
    }
    getUserById(id: number) {
        return {id}
    }
    
}