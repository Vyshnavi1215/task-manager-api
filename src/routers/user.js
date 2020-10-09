const express = require ('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

const router = new express.Router()

//making post call to create data

router.post('/users',async (req, res)=>{
    const user = new User(req.body)
   
    try {
     await user.save()
     sendWelcomeEmail(user.email, user.name)
     const token = await user.generateAuthToken()

     res.status(201).send({user:user, token:token})

     //res.status(201).send(user)

    }
    catch(error) {
     res.status(400).send(error)
    }
 })
 

 router.post('/users/login', async (req, res)=>{
     try{

        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        res.send({user: user, token:token})

        //res.send(user)
         
     }catch(e){
         res.status(400).send()
     }

 })

 router.post('/users/logout', auth, async (req, res) =>{
     try{

        req.user.tokens = req.user.tokens.filter( (token) =>{
            return token.token != req.token

        })

        await req.user.save()

        res.send()

     } catch (e) {
         res.status(500).send()
     }


 })

 router.post('/users/logoutAll', auth, async (req, res) =>{

     try{
         req.user.tokens = []

         await req.user.save()

         res.send()
         

     } catch(e) {
        res.status(500).send()
     }

 })



 // To get the profile -read call
 router.get('/users/me', auth , async (req, res)=>{ //here auth is the middleware function, the route will run the run handler if and only if the middleware calls the next method

    res.send(req.user)

})

// router.get('/users/:id', async (req, res)=>{
//     const _id = req.params.id
    
//     try {
//         const user = await User.findById(_id)
//         if(!user){
//             return res.status(404).send()
//         }
//          res.send(user)

//     } catch (e) {
//         res.status(500).send()
//     }

// })

router.patch('/users/me', auth, async (req, res )=>{

    //if we are trying to update the property that doent exist, the program wouldnt crash but mongoose will ignore it.

    //getting the values from the request body using the object property.
    //with the below line we can get the keys of the key value pair entered from the request body for example { "name" : "xyz","age" : 26} etc

    const updates = Object.keys(req.body)

    //storing which properties can be updated in an array.
    const allowedUpdates = ['name', 'email', 'password', 'age']

    //this every method checks whether the updated property exists in allowedupdates or not, this runs each and every time for each update
     const isValidoperation = updates.every((update)=>{
       return allowedUpdates.includes(update) //return the boolean
       //console.log(isValidoperation.toString())
     })

     if(!isValidoperation){
         return res.status(400).send({error : "Invalid Updates"})
     }

    try {

        //const user = await User.findById(req.user.id) //since mongoose bypassess midleware, we are going to change the below one liner code to three liner, 1. finding id, 2.iterating over the updates 3.saving

        updates.forEach( (update ) =>{
            req.user[update] = req.body[update]

        })
        await req.user.save()

         res.send(req.user)
    } catch (error) {

        res.status(400).send(error)
    }

})

//deleting an user

router.delete('/users/me',  auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user.id)
        // if(!user) {
        //     return res.status(404).send()
        // }
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)

    } catch (e) {
        res.status(500).send()

    }

})

const upload = multer ({
   // dest : 'avatars',
    limits :{
     fileSize : 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
          return cb(new Error('Please upload an image'))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth,  upload.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({width :250, height :250}).png().toBuffer()
    req.user.avatar = buffer //taking the data from request from the attribute file and save it user model on the field avatar
    await req.user.save()
    res.send()

}, (error, req, res, next)=> {
    res.status(400).send({error : error.message})

})

router.delete('/users/me/avatar', auth, async(req, res) =>{
    req.user.avatar = undefined //clear the field
    await req.user.save()
    res.send()

})

router.get('/users/:id/avatar', async(req, res) =>{
    try{
    const user = await User.findById(req.params.id)
    if(!user || !user.avatar){
        throw new Error
    }
   
    res.set('Content-Type','image/png')
    res.send(user.avatar)

    }catch(e){
        res.status(404).send()
    }


})




module.exports = router