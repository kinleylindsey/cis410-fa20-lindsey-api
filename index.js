const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const db = require('./dbConnectExec.js')
const config = require('./config.js')
const auth = require('./middleware/authenticate')

//azurewebsites.net, colostate.edu
const app = express();
app.use(express.json())
app.use(cors())


app.get("/hi", (req,res)=>{
    res.send("hello world")
})

app.listen(5000, ()=>{console.log(`app is running on port 5000`)})