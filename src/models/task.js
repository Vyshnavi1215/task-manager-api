const mongoose = require('mongoose')


const taskSchema = new mongoose.Schema({
    description :{
       type : String,
       trim : true,
       required : true,
    },
    completed:{
        type : Boolean,
        default : false
    },
    owner :{
        type : mongoose.Schema.Types.ObjectId, // takes the id of the user which is an object so objectid
        required :true,
        ref : 'User' // to create the relation between the task and the user , ref short form for reference

    }

},{
    timestamps : true
})

//task model
const Task = mongoose.model('Task', taskSchema)

module.exports =Task