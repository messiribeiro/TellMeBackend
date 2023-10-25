import { fastify } from "fastify"
import { pbkdf2Sync } from 'crypto'
import { DataBasePostgres } from "./database-postgres.js";
import fastifyCors from 'fastify-cors'
import {sql} from "./db.js";
import { Server } from 'socket.io';

import {Expo} from 'expo-server-sdk'

let expo = new Expo();

const server = fastify()
const database = new DataBasePostgres()

const httpServer = server.server;
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});


const activeSockets = {}

io.on('connection', (socket) => {

    socket.on('register', data =>{
        console.log("Cliente conectado", data)
        activeSockets[data.userId] = socket
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    
    socket.on('newLetter', async (data)=>{
        console.log(data)
        const {userId} = data;
        const babeId = await sql `select babe from users where id=${userId}`

        if(activeSockets[babeId[0].babe]) {

            const letters = await sql `select * from letters where sender=${userId} and target=${babeId[0].babe}`
            console.log(letters)
            activeSockets[babeId[0].babe].emit('newLetter', letters[length-1]); 

            
        }
    })

    

    
    socket.on('feelingUpdate', async (data) => {
        console.log(data)
        const {userId} = data;
        const babeId = await sql `select babe from users where id=${userId}`

        if(activeSockets[babeId[0].babe]) {

            const userFeel = await sql `select feel from users where id=${userId}`
            
            activeSockets[babeId[0].babe].emit('feelingUpdate', userFeel[0].feel); 

            
        }
    });


});





const sendNotification = async (notification) => {
    let message = {
      to: notification.token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
    };
  
    try {
      await expo.sendPushNotificationsAsync([message]);
      return { sucesso: true };
    } catch (erro) {
      console.error('Erro ao enviar notificação:', erro);
      return { sucesso: false, erro };
    }
  };


const fixedSalt = 'lud_i_love_you_<3';



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
    try{
        console.log("tentando fazer login")

        const { username, password} = request.body;

    
        const usernameVerify = await database.list(username)
            
        
        var hash = pbkdf2Sync('lueuteamo', fixedSalt, 1000, 64, 'sha512').toString('hex');
        
    
        if(username == 'ludyzinha' && usernameVerify.password == hash) {
        
                hash = pbkdf2Sync(password, fixedSalt, 1000, 64, 'sha512').toString('hex');
                await database.updateUser({username, hash, token})
                
                const userfound = await database.login({ username, hash });
                console.log(userfound);
                reply.send(userfound[0]);
    
        }else {
    
            if (usernameVerify) {
                
                hash = pbkdf2Sync(password, fixedSalt, 1000, 64, 'sha512').toString('hex');
                
                try {
                    const userfound = await database.login({ username, hash });
                    
                    if(userfound.length == 0) {
                        console.log('401')
                        const status = {status: 401}
                        reply.send(status)
                    }else {
                        reply.status(200).send(userfound[0]);
                    }
        
                }catch(e){
                    reply.status(404)
                    console.log(e)
                }
                
            } else {
                try {
                    await database.create({
                        username,
                        password: hash,
                        photo: 'https://cdn.discordapp.com/attachments/912789651188760599/1164982935393411113/GJ3dpt.png?ex=654531e8&is=6532bce8&hm=6639629f16faadf5f40775c8a7a901fc4e3b4975681798e6561b70ae040ba042&',
                        feel: 0.5,
                        babe: 3,
                        
                    })
        
                    
                    const userfound = await database.login({ username, hash });
                    console.log(userfound);
                    reply.send(userfound[0]);
                    console.log("login concluído")

    
                }catch(e) {
                    console.log(e)
                }
    
                
            
            }
        }
    }catch(e) {
        console.log(e)
    }
    
    
})

server.post('/feeling/:id/:feeling', async (request, reply) => {

    try{
        console.log("tentando mudar o feeling")
        const {id, feeling} = request.params;
        await database.updateFeeling(id, feeling)

        const username = await sql `select * from users where id=${id}`

        const babe = await sql `select * from users where id=${username[0].babe}`

        function feelingString(feeling) {
            if(feeling < 0.2){
                return "muito triste 😿"
            }
            if(feeling <= 0.5) {
                return "triste 😢"
            }
            if(feeling < 0.8){
                return 'feliz 🙃'
            }
            if(feeling <= 1) {
                return "muito feliz 😁"
            }
        }

        sendNotification({
            title: 'Algo aconteceu!!',
            body: `${username[0].username} está se sentindo ${feelingString(feeling)}`,
            token: babe[0].token.trim()
        })
        console.log(babe[0].token.trim())

        reply.status(200).send()
        console.log("feeling alterado")

    }catch (e){
        console.log(e)
    }
    
    

})

server.post("/letter", async (request, reply) => {
    
    try {
        console.log("tentando postar uma cartinha")

        const { text, sender, target} = request.body;
        const viewed = false
        await database.createLetter({ text, sender, target, viewed});

        const babe = await sql `select username from users where id=${sender}`
        const username = await sql `select username from users where id=${target}`
        var token = await sql `select token from users where id=${target}`
        sendNotification({
            title: `Você tem algo para ler :)`,
            body: `${babe[0].username} te enviou uma cartinha ❤️`,
            token: token[0].token.trim()
        })

        reply.status(200).send()
        console.log("cartinha enviada")

    }catch(e) {
        console.log('erro: ', e)
    }
    
})

server.get('/lettersBySenderAndTarget/:sender/:target', async (request, reply) =>{

    try {
        console.log("tentando listar cartinhas")

        const {sender, target} = request.params;
        console.log(sender, target)
        const letters = await database.getLetterBySenderAndTarget({sender, target});
        reply.status(200).send(letters);
        console.log("cartinhas listadas")

    }catch(e) {
        console.log(e)  
    }
    
})

server.put("/tokenUpdate", async (request, reply)=> {
    const {token, userId} = request.body;
    console.log(token.data, userId); 
    try {
        await sql `update users set token=${token.data} where id=${userId}`
        reply.status(200);
    }catch (e) {
        console.log("errouuu: ", e)
    }
})

server.put('/letterViewUpdate/:id', async (request, reply) =>{
    const {id} = request.params;
    const letter = await database.getLetter(id)
    const sender = letter[0].sender
    const target = letter[0].target

    const targetData = await sql `select * from users where id=${target}`
    const senderData = await sql `select token, username from users where id=${sender}`

    try{


        if(letter[0].viewed == false) {
            sendNotification({
                title: `Ei ${senderData[0].username} .-.`,
                body: `${targetData[0].username} abriu sua cartinha`,
                token: senderData[0].token.trim()
            })
        }

        await database.letterViewUpdate(id);


        

        

        

        reply.status(200)
    }catch(e){
        console.log(e)
        reply.send(500)
    }

} )


server.listen({
    host: '0.0.0.0',
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