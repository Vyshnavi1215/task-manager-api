//This middleware function takes the auth token from the request and verifies it using jwt.verify and if it is verified it finds the user in the database.

const jwt = require('jsonwebtoken')
const User = require('../models/user')


const auth = async( req, res, next) =>{

    try{
        const token = req.header('Authorization').replace('Bearer ', '') // the name authorization should be same when we pass the header,in order to get the jwt, we  will have to emove the value of Bearer which is sent while request is being triggered
        //console.log(token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET) //checking whether the requested token is valid or not.

        const user = await User.findOne({ _id : decoded._id, 'tokens.token': token})//checking the tokens is still the part of tokens array
        //the above line checks for the use in the database with the given token if it is still stored

        if(!user){
            throw new Error()
        }
        
        req.token = token
        req.user = user 
        next()

    } catch(e) {
        res.status(401).send({error : 'Please authenticate.'})
    }

    

}

module.exports = auth