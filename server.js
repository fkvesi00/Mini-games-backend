const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
const knex = require('knex');
const { response } = require('express');
const { use } = require('express/lib/application');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'lozinka',
      database : 'mini-games'
    }
  });

app.use(bodyParser.json());
app.use(cors());

// const database = {
//     users: 
//     [
//         {
//             id:'0',
//             name:'Filip',
//             email:'fkvesi00@fesb.hr',
//             password:'lozinka',
//             numberOfLogins:0,
//             joined: new Date()
//         },
//         {
//             id:'1',
//             name:'Karlo',
//             email:'kkozaric00@fesb.hr',
//             password:'lozinka',
//             numberOfLogins:0,
//             joined: new Date()
//         },
//         {
//             id:'2',
//             name:'Filip',
//             email:'froncevic00@fesb.hr',
//             password:'lozinka',
//             numberOfLogins:0,
//             joined: new Date()
//         },
//         {
//             id:'3',
//             name:'Nikola',
//             email:'nmartinovic@fesb.hr',
//             password:'lozinka',
//             numberOfLogins:0,
//             joined: new Date()
//         }
//     ]
// }

app.get('/',(req,res) => {
    res.json('server radi');
})

app.post('/signIn', (req,res) => {
    const {email,password} = req.body;
    db('login').select('email','password').where({email:email})
    .then(user => {
        console.log(user)
        if(user[0].password === password){
            res.json(user[0])
        }else{
            console.log(user.password,password)
            res.status(400).json('Email or password wrong')
        }
    }).catch(err => res.status(400).json('something went wrong'))
})

app.post('/register', (req, res) => {
    const {name,email,password} = req.body
    db.transaction(trx => {
        trx.insert({
            password:password,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
                .returning('*')
                .insert({
                    email:loginEmail[0].email,
                    name:name,
                    joined:new Date()
                })
                .then(user => {
                res.json(user[0]);
                })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })    
    
    .catch(err=> res.status(400).json('Unable to register'));
    // if(name.length>0 && password.length>0 && email.includes('@')){
    //     database.users.push({
    //         id:database.users.length.toString(),
    //         name:name,
    //         email:email,
    //         password:password,
    //         numberOfLogins:0,
    //         joined:new Date()
    //     })
    //     res.json(database.users[database.users.length-1]);
    // }else{
    //     res.status(400).json('Input is not valid');
    // }
})

app.get('/profile/:id', (req,res) => {
    const {id} = req.params;
    db('users').select('*').where({
        id:id
    })
    .then(user => {
        if(user.length)
            res.json(user[0])
        else
            res.json('user not found');
    })
    .catch(err => res.status(400).json('error'));
})

app.put('/numberOfLogins', (req,res) => {
    const {email} = req.body;
    db('users').where('email', '=', email)
    .increment('entries', 1)
    .returning('email')
    .then(emailFromDb => {
        db('users').select('name').where({email:emailFromDb[0].email})
        .then(name => {
            if(name)
                res.json(name[0].name)
            else
                res.status(400).res.json('something went wrong')
        }).catch(err => res.status(400).json('Error someting went wrong'))
    })
    .catch(err => res.status(400).json('unable to update entries'));
})

app.listen(3000, ()=>{
    console.log('app is running on port 3000');
});

/* 
koje cemo rute imat:

1. root --> / samo kaze poruku da radi

2. sign in --> POST metoda, jer cemo preko tijela slat podatke
Odgovor ce biti ili succes ili fail

3. register --> POST metoda dodavanje naseg korisinka u bazu podataka
Odgovor ce biti korisnik koji se registriro

4. profile/:id --> GET metoda
Odgovor ce biti korisnik

5. brojPosjecivanja --> PUT  metoda, azurirat cemo broj puta koliko se
korisnik pojavio na nasu stranicu  
Odgovor ce biti korisnik

*/