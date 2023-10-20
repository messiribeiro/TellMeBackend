import {sql} from './db.js'

sql`
    CREATE TABLE letter (
        id SERIAL PRIMARY KEY,
        text VARCHAR(255),
        sender INT REFERENCES users(id),
        target INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at DATE
    );

    `.then(()=>{
        console.log("Created Table")
    })