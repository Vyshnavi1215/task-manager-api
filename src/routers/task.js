const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')


const router = new express.Router()
// creating tasks
router.post('/tasks', auth, async (req, res)=>{
    //const task = new Task(req.body)

   const task = new Task({
       ...req.body, // ES6 Spread operator
       owner : req.user._id
   })

   try {
        await task.save()
        res.status(201).send(task)
   } catch(e) {
      res.status(400).send()
   }

})


 
//To get the tasks - read call

//GET /tasks?completed = true/false
//GET /tasks?limit=1
//GET /tasks?sortBy=createdAt:desc // field and the order
router.get('/tasks', auth, async(req, res)=>{

    const match ={} // this object match variable will be contained a property based on the query string provided
    const sort = {}

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 :1 //converting the asc or desc value provided by the client to 1 or -1

    }

    if(req.query.completed){
 
     match.completed = req.query.completed === 'true'  //setting the property value and comparing too

    }

    try {

        //const tasks = await Task.find({ })

        const tasks = await Task.find({owner : req.user._id})

        await req.user.populate({
            path :'tasks',
            match :match,
            options :{
                limit :parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort : sort
            }
        }).execPopulate()


        res.send(req.user.tasks)

    } catch (e) {
        res.status(400).send()

    }

})

router.get('/tasks/:id', auth, async (req, res)=>{
    const  _id = req.params.id

    try {
       // const task = await Task.findById(_id)

       const task = await Task.findOne({_id: _id , owner: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e){
        res.status(500).send()

    }

})

router.patch('/tasks/:id', auth ,async(req, res) => {
      
    const allowedUpdates = ['description','completed']

    const updates  = Object.keys(req.body)

    const isValidOperation = updates.every( (update )=> {
                return allowedUpdates.includes( update)
    })

    if(!isValidOperation){
       return res.status(400).send({ error : "Invalid Updates"})
    }

    
    try     {

        //const task = await Task.findById(req.params.id)

        const task = await Task.findOne({_id :req.params.id, owner : req.user.id})

        //const task = await Task.findByIdAndUpdate( req.params.id, req.body, { new : true, runValidators : true})
        if(!task)
        {
           return res.status(404).send()
        }
        updates.forEach((update) =>{ 
            task[update] = req.body[update]

        })
        await task.save()
        res.send(task)

    } catch (e) {
        res.status(400).send()

    }

})

router.delete('/tasks/:id' , auth,  async (req, res) => {

    try {
        //const task = await Task.findByIdAndDelete(req.params.id)

        const task = await Task.findOneAndDelete({_id:req.params.id, owner : req.user.id })

        if(!task) {
            return res.status(400).send()
        }
            res.send(task)

    } catch (e) {
        res.status(500).send()

    }

})




module.exports = router