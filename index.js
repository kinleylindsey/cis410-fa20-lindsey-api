const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const cors = require('cors')

const db = require('./dbConnectExec.js')
const config = require('./config.js')
const auth = require('./middleware/authenticate')

//azurewebsites.net, colostate.edu
const app = express();
app.use(express.json())
app.use(cors())

app.post('/contacts/logout', auth, (req,res)=>{
    var query = `UPDATE Contacts
    SET Token = NULL
    WHERE ContactPK = ${req.contact.ContactPK}`

    db.executeQuery(query)
        .then(()=>{res.status(200).send()})
        .catch((error)=>{
            console.log("error in POST /contacts/logout", error)
            res.status(500).send()
    })
})

// app.get('/reviews/me', auth, async(req,res)=>{
//     let contactPK = req.contact.ContactPK;

// })

// app.patch("/reviews/:pk", auth, async(req,res)=>{
//     let reviewPK = req.params.pk
//     //Make sure that the user can only edit their own reviews
// })

// app.delete("/reviews/:pk", auth, async(req,res)=>{
//     let reviewPK = req.params.pk
//     //Make sure that the user can only edit their own reviews
// })


app.get("/hi", (req,res)=>{
    res.send("hello world")
})

app.get('/contacts/me', auth, (req,res)=>{
    res.send(req.contact)
})

app.post("/contacts/login", async (req,res)=>{
    // console.log(req.body)

    var email = req.body.email;
    var password = req.body.password;

    if(!email || !password){
        return res.status(400).send('bad request')
    }

    //1. check that user email exists in db
    var query = `SELECT *
    FROM Contacts
    WHERE Email = '${email}'`

    
    let result;

    try{
        result = await db.executeQuery(query);
    }catch(myError){
        console.log('error in /contacts/login:', myError);
        return res.status(500).send()
    }

    // console.log(result)

    if(!result[0]){return res.status(400).send('Invalid user credentials')}

        //2. check their password

        let user = result[0]
        // console.log(user)
    
        if(!bcrypt.compareSync(password,user.Password)){
            console.log("invalid password");
            return res.status(400).send("Invalid user crendentials")
        }
    
        //3. generate a token
    
        let token = jwt.sign({pk: user.ContactPK}, config.JWT, {expiresIn: '60 minutes'} )
    
        // console.log(token)
    
        //4. save the token in db and send token and user info back to user
        let setTokenQuery = `UPDATE Contacts
        SET Token = '${token}'
        WHERE ContactPK = ${user.ContactPK}`
    
        try{
            await db.executeQuery(setTokenQuery)
    
            res.status(200).send({
                token: token,
                user: {
                    NameFirst: user.NameFirst,
                    NameLast: user.NameLast,
                    Email: user.Email,
                    ContactPK: user.ContactPK
                }
            })
        }
        catch(myError){
            console.log("error setting user token ", myError);
            res.status(500).send()
        }
    
    })

    app.post("/contacts", async (req,res)=>{
        // res.send("creating user")
        // console.log("request body", req.body)
    
        var nameFirst = req.body.nameFirst;
        var nameLast = req.body.nameLast;
        var email = req.body.email;
        var password = req.body.password;
    
        if(!nameFirst || !nameLast || !email || !password){
            return res.status(400).send("bad request")
        }
    
        nameFirst = nameFirst.replace("'","''")
        nameLast = nameLast.replace("'","''")
    
        var emailCheckQuery = `SELECT Email
        FROM Contacts
        WHERE Email = '${email}'`
    
        var existingUser = await db.executeQuery(emailCheckQuery)
    
        // console.log("existing user", existingUser)
        if(existingUser[0]){
            console.log(existingUser);
            return res.status(409).send('Please enter a different email.')
        }
    
        var hashedPassword = bcrypt.hashSync(password)
    
        var insertQuery = `INSERT INTO Contacts (NameFirst,NameLast,Email,Password)
        VALUES('${nameFirst}','${nameLast}','${email}','${hashedPassword}')`
    
        db.executeQuery(insertQuery)
            .then(()=>{res.status(201).send()})
            .catch((err)=>{
                console.log("error in POST /contacts",err)
                res.status(500).send()
            })
    })

    //6.
    app.post("/camera", async, auth, (req,res)=>{

        try{ 
            var cameraPK = req.body.cameraPK;
            var brand = req.body.brand;
            var lens = req.body.lens;
            var memoryCard = req.body.memoryCard;
        
            if(!cameraPK || !brand || !lens || !memoryCard){res.status(400).send("bad request")}
        
            // console.log("here is the contact in /reviews",req.contact)
            // res.send("here is your response")
    
            let insertQuery = `INSERT INTO Camera(CameraPK, Brand, Lens, MemoryCard, ContactFK)
            OUTPUT inserted.CameraPK, inserted.Brand, inserted.Lens, inserted.MemoryCard
            VALUES('${cameraPK}','${brand}', ${lens}, ${memoryCard}, ${req.contact.ContactPK})`
    
            let insertedReview = await db.executeQuery(insertQuery)
    
            // console.log(insertedReview)
            res.status(201).send(insertedReview[0])
        }
        catch(error){
            console.log("error in POST /camera", error);
            res.status(500).send()
        }
    })

    //7.
    app.get('/records', auth, (req,res)=>{
        var query = `SELECT * FROM Camera LEFT JOIN Contacts ON Contacts.ContactPK = Camera.ContactFK WHERE Contacts.ContactPK = ${req.contact.ContactPK}`
        db.executeQuery(query)
        .then((result)=>{
            res.status(200).send(result)
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).send()
        })
        // res.send(req.contact)
    })

    //1.
    app.get('/cameras', (req,res)=>{
        var query = `SELECT *
        FROM Camera`
        db.executeQuery(query)
        .then((result)=>{
            res.status(200).send(result)
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).send()
        })
        // res.send(req.contact)
    })

    //2.
    app.get("/cameras/:pk", (req, res)=>{
        var pk = req.params.pk
        // console.log("my PK:" , pk)
    
        var myQuery = `SELECT *
        FROM Camera
        LEFT JOIN CameraType
        ON CameraType.TypePK = Camera.TypeFK
        WHERE CameraPK = ${pk}`
    
        db.executeQuery(myQuery)
            .then((cameras)=>{
                // console.log("Movies: ", movies)
    
                if(cameras[0]){
                    res.send(cameras[0])
                }else{res.status(404).send('bad request')}
            })
            .catch((err)=>{
                console.log("Error in /cameras/pk", err)
                res.status(500).send()
            })
    })

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)})

