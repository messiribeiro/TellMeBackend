import { randomUUID } from "crypto";

export class DataBaseMemory {
    #users = new Map();

    create(user){
        const userId = randomUUID;
        this.#users.set(userId, user)
    }

    update(id, user){
        this.#users.set(id, user);
    }

    delete(id) {
        this.#users.delete(id)
    }
    list() {
        return Array.from(this.#users.values()) 
    }
}