import { fastify } from "fastify"
import { pbkdf2Sync } from 'crypto'
import { schedule } from 'node-cron'
import { DataBasePostgres } from "./database-postgres.js";
import fastifyCors from 'fastify-cors'
import { request } from "http";


const fixedSalt = 'lud_i_love_you_<3';


const server = fastify()
const database = new DataBasePostgres()

server.register(fastifyCors, {
    origin: 'true'
})


server.post("/user", async (request, reply) => {
    const { username, password, photo } = request.body;

    //verificando se existe algum usuário com esse nome

    const usernameVerify = await database.list(username)


    if (usernameVerify) {
        reply.status(409);
    } else {

        var hash = pbkdf2Sync(password, fixedSalt, 1000, 64, 'sha512').toString('hex');
        await database.create({
            username,
            password: hash,
            photo
        })


        reply.status(201).send()
    }

})

server.get('/user/:id', async (request, reply)=> {
    const {id} = request.params

    const user = await database.getUserData(id)

    reply.send(user[0])
} )

server.get('/letter/:id', async (request, reply)=>{
    const {id} = request.params;
    const letter = await database.getLetter(id);
    reply.send(letter[0]);
})

server.post("/login", async (request, reply) => {
    const { username, password } = request.body;

    // console.log(username, password)
    const usernameVerify = await database.list(username)


    if (usernameVerify) {

        try {
            const hash = pbkdf2Sync(password, fixedSalt, 1000, 64, 'sha512').toString('hex');
            const userfound = await database.login({ username, hash });
            console.log(userfound)
            console.log(userfound.length)
            if(userfound.length == 0) {
                console.log('401')
                const status = {status: 401}
                reply.send(status)
            }else {
                reply.status(200).send(userfound[0]);
            }

        }catch(e){
            console.log(e)
            reply.status(404)
        }
        
    } else {

        try {
            var hash = pbkdf2Sync(password, fixedSalt, 1000, 64, 'sha512').toString('hex');
            
            var photo = 'https://cdn.discordapp.com/attachments/912789651188760599/1164982935393411113/GJ3dpt.png?ex=654531e8&is=6532bce8&hm=6639629f16faadf5f40775c8a7a901fc4e3b4975681798e6561b70ae040ba042&'
            var babe = 3

            if(username == 'ludyzinha') {
                await database.create({
                    username,
                    password: hash,
                    photo: 'https://cdn.discordapp.com/attachments/912789651188760599/1162516308097777866/377361248_1045576183352455_7262995329521998300_n.png?ex=653c38ae&is=6529c3ae&hm=2478641f0247aac2a46fd51c018838f2a922b9a649dea1fd09565e00dbcc0257&',
                    feel: 0.5,
                    babe: 3,
                })



                const userfound = await database.login({ username, hash });
                
                await database.babeUpdate({id: 3, babe: userfound[0].id});

                console.log(userfound)
                reply.send(userfound[0]);


            }else if(username == 'sarinha') {
                await database.create({
                    username,
                    password: hash,
                    photo: 'https://media.discordapp.net/attachments/912789651188760599/1164734977175466062/381639076_1456187571829223_7265444941741452401_n.png?ex=65444afa&is=6531d5fa&hm=a3aca8e6b1c6dd8c7ef663dc7dd86acc043b9ec8360178722b3956b54fe5afe4&=&width=575&height=575',
                    feel: 0.5,
                    babe: 3
                })

                const userfound = await database.login({ username, hash });

                await database.babeUpdate({id: 3, babe: userfound[0].id});

            
                console.log(userfound)
                reply.send(userfound[0]);
            }else {
                await database.create({
                    username,
                    password: hash,
                    photo: 'https://cdn.discordapp.com/attachments/912789651188760599/1164982935393411113/GJ3dpt.png?ex=654531e8&is=6532bce8&hm=6639629f16faadf5f40775c8a7a901fc4e3b4975681798e6561b70ae040ba042&',
                    feel: 0.5,
                    babe: 3
                })

                const userfound = await database.login({ username, hash });

            
                console.log(userfound)
                reply.send(userfound[0]);
            }




            

            
        }catch (e) {
            console.log(e)
            reply.status(404)
        }
        
    }


    
})

server.post('/feeling/:id/:feeling', async (request, reply) => {
    const {id, feeling} = request.params;
    await database.updateFeeling(id, feeling)
    reply.status(200).send()

})

server.post("/letter", async (request, reply) => {
    const { text, sender, target } = request.body;
    const viewed = false
    await database.createLetter({ text, sender, target, viewed});
    reply.status(200).send()
})

server.get('/lettersBySenderAndTarget/:sender/:target', async (request, reply) =>{
    try {
        const {sender, target} = request.params;
        console.log(sender, target)
        const letters = await database.getLetterBySenderAndTarget({sender, target});
        reply.status(200).send(letters);
    }catch(e) {
        console.log(e)  
    }
    
})

server.put('/letterViewUpdate/:id', async (request, reply) =>{
    const {id} = request.params;

    try{
        console.log(id)
        await database.letterViewUpdate(id);
        reply.status(200)
    }catch(e){
        reply.send(500)
    }

} )


server.listen({
    port: process.env.PORT ?? 3333
})

// function dataFormat(data) {

//     const formatedDate = data.map(item => {
//         const dateObj = new Date(item.time);
//         const dia = String(dateObj.getDate()).padStart(2, '0');
//         const mes = String(dateObj.getMonth() + 1).padStart(2, '0');;
//         const ano = String(dateObj.getFullYear()).slice(-2);
//         const hora = String(dateObj.getHours()).padStart(2, '0');
//         return {
//             time: `${dia}/${mes}/${ano}:${hora}`,
//             id: item.id
//         }
//     });
//     return formatedDate;
// }

// function newLetters(data) {
//     var newArray = [];

//     data.map(e => {
//         newArray.push({"time": e.created_at.toString(), "id": e.id})
//     })
    
//     newArray = dataFormat(newArray)
//     return newArray;
// }

// function verifyTime(date1, date2) {
//     const parseDate = (str) => {
//         const [day, month, time] = str.split("/");
//         const [hour, minute] = time.split(":");
//         return {
//             day: parseInt(day),
//             month: parseInt(month),
//             hour: parseInt(hour),
//             minute: parseInt(minute)
//         };
//     };

//     const d1 = parseDate(date1);
//     const d2 = parseDate(date2);

//     const date1Obj = new Date(2000, d1.month - 1, d1.day, d1.hour, d1.minute);
//     const date2Obj = new Date(2000, d2.month - 1, d2.day, d2.hour, d2.minute);

//     const diffInMs = Math.abs(date2Obj - date1Obj);
//     const diffInHours = diffInMs / (1000 * 60 * 60);

//     return diffInHours >= 1;


// }

// const date = new Date();
// const day = date.getDate();
// const month = date.getMonth()+1;
// const hours = date.getHours();
// const minutes = date.getMinutes()

// schedule('*/60 * * * * *', async () => {
//     var letters = await database.getLettersDate();
//     letters = newLetters(letters);
//     const currentTime = `${day}/${month}/${hours}:${minutes}`
    

//     letters.map(async e => {
//         if(verifyTime(e.time, currentTime)){
//             await database.deleteLetter(e.id)
//             console.log("alguma cartinha foi deletada .-.")

//         }
//     })  


//     // 14/Out/23:01
// });