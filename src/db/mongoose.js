const mongoose = require('mongoose')

//connecting to database.
mongoose.connect(process.env.MONGODB_URL,{
    useUnifiedTopology : true,
    useNewUrlParser :true,
    useCreateIndex :true,
    useFindAndModify :false
})



