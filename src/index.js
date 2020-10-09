const express = require('express')
require('./db/mongoose')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
app.use(express.json())

const port = process.env.PORT
app.use(userRouter)
app.use(taskRouter)

//server will be up and running on port 3000 in local machine
 app.listen(port,()=>{
    console.log('Server is up and running on port', port)
})











