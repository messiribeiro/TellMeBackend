import {sql} from "./db.js";

export class DataBasePostgres {
    async updateUser(user) {
        await sql `update users set password=${user.hash}, token={${user.token}} where username=${user.username}`
    }
    async create(user){
            await sql`insert into users (username, password, photo, feel, babe, token) values (${user.username}, ${user.password}, ${user.photo}, ${user.feel}, ${user.babe}, ${user,token}) `
        }

    async babeUpdate(data){
        await sql `uptade users set babe=${data.babe} where id=${data.id}`
    }

    delete(id) {
    }

    async getUserData(id) {
        const user = await sql`select username, photo, feel, babe from users where id=${id}`
        return user;
    }

    async list(username) {
        const users = await sql`select * from users where username=${username}`;
        return users[0]
    }

    async login(user) {
        const userfound = await sql `select * from users where username=${user.username} and password=${user.hash}`;
        return userfound;
    }


    async createLetter(letter) {
        await sql `insert into letters (text, sender, target, viewed) values (${letter.text}, ${letter.sender}, ${letter.target}, ${letter.viewed})`
    }

    async getLettersDate(){
        const letters = await sql `select created_at, id from letters`;
        
        return letters;
    }

    async deleteLetter(id){
        await sql`delete from letters where id = ${id}`
    }

    async updateFeeling(id, feeling) {
        await sql`update users set feel = ${feeling} where id=${id}`
    }

    async getLetter(id){
        return await sql `select * from letters where id=${id}`
    }

    async getLetterBySenderAndTarget(letter) {
        return await sql `select * from letters where sender=${letter.sender} and target=${letter.target}`
    }
    async letterViewUpdate(id){
        await sql`update letters set viewed=true where id=${id}`
    }
}

