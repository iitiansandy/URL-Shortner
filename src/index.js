const express=require('express');

const bodyParser=require('body-parser');
const router=require('./route/route');
const app=express();
const mongoose=require('mongoose');



app.use(bodyParser.json());

 
app.use(bodyParser.urlencoded({extended:true}));


mongoose.connect("mongodb+srv://Rashmivishwakarma:rashmi1996@cluster0.m1asu.mongodb.net/group3Database?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )


app.use('/',router)


app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});

