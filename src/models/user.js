const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

//creating a schema
const userSchema = new mongoose.Schema({
    name :{
       type : String,
       required : true,
       trim : true
    },
    email :{
        type : String,
        unique : true,
        required : true,
        trim : true,
        lowercase : true,
        validate( value){
            if(!validator.isEmail(value)){
             throw  new Error('Email is invalid')
        }
    }

    },
    age :{
        type : Number,
        defalut :0,
        validate(value) {
            if(value < 0){
                throw new Error('Age must be a positive number')
            }

        }
    },
    password :{
        type : String,
        required : true,
        trim : true,
        minlength :7,
        validate(value){
            // if(value.length <6){
            //     throw new Error('Password should contain more than 6 characters')
            // }
            if(value.toLowerCase().includes('password')){
                throw new Error('Password should not contain "password"')
            }
        }
    },
    tokens :[{
        token :{
            type : String,
            required :true
        }
        
    }],
    avatar :{
        type : Buffer
    }
},{
    timestamps : true
})
// userSchema.methods.generateToken = async function() {
//     const user = this
//     const token = jwt.sign({_id : user.id}, 'thisismynewcourse')
//     return token

// }

userSchema.virtual('tasks',{
    ref : 'Task',
    localField : '_id', //id of the user
    foreignField : 'owner' //id of the user but this is the one referencing in the task fields
})

userSchema.methods.toJSON = function () {  // whenever we call res.send, that would internally call JSON.stringify and from there toJSON method will be called
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject

}


userSchema.methods.generateAuthToken = async function() { //schema.methods for instances
    const user = this
    const token = await jwt.sign({_id : user.id.toString()}, process.env.JWT_SECRET)

   user.tokens = user.tokens.concat({ token:token}) //concatenating token to user model to save in data base
    await user.save()

    return token
}


userSchema.statics.findByCredentials = async (email, password)=> { //schema.statics for models
    const user = await User.findOne({ email :email})

    if(!user){
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    
    if(!isMatch){
        throw new Error('Unable to login')
    }

    return user

}


//hash the plain text password before saving
userSchema.pre('save', async function(next) {
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }


    
     next() //this next method is mandatory, if we dont call next method, the schema might assume that we are still running the code and its not going to stop
})

//Delete user tasks when a user is removed

userSchema.pre('remove', async function(next) {

    const user = this

    await Task.deleteMany({ owner : user._id})

    
    next()

})


//creating a model.
const User= mongoose.model('User', userSchema)

module.exports = User