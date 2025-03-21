const ejs = require('ejs');
const express = require("express")
const bodyParse = require("body-parser")
const app = express()
const mongoose = require("mongoose")
const _ = require("lodash")
require('dotenv').config()


app.set('view engine','ejs')
app.use(bodyParse.urlencoded({extended:true}))
mongoose.connect(process.env.MONGO_URI)

const dataSchema = mongoose.Schema({name:String})
const Item = mongoose.model("item",dataSchema)

const i1 = new Item({name:"Laundry"})
const i2 = new Item({name:"Packing"})
const i3 = new Item({name:"Shopping"})

const defaultItems = [i1,i2,i3]

listSchema = mongoose.Schema({
    name:String,
    items:[dataSchema]
})

const List = mongoose.model("list",listSchema)

app.get("/",function(req,res){
    Item.find({}).then((items)=>{
        if(items.length==0){
            Item.insertMany(defaultItems).then(function(){
                console.log("default data inserted")
            }).catch(function(err){
                console.log(err)
            })
            res.redirect("/")
        }
        else{
            res.render('checklist',{title:"Today",data:items})
        }
    })
})

app.get("/:newList", async function (req, res){
    const newListName = _.capitalize(req.params.newList) 

    if (newListName.toLowerCase() === "favicon.ico") {
        return res.status(204).end(); // Ignore favicon requests
    }

    try {
        let foundItem = await List.findOne({ name: newListName });

        if (!foundItem) {
            const list = new List({
                name: newListName,
                items: defaultItems
            });

            await list.save(); // Ensure the list is saved before redirecting
            console.log("New list created:", newListName);
            res.redirect("/" + newListName);
        }
        else{
            res.render('checklist',{title:foundItem.name,data:foundItem.items})
        }
    } catch (err) {
        console.error("Error finding/creating list:", err);
        res.status(500).send("Server error");
    }
});


app.post("/",async function(req,res){
    var task = req.body.task
    var listTitle = req.body.submit
    const i = new Item({name:task})
    try{
        if(listTitle=="Today"){
            await i.save()
            res.redirect("/")
        }else{
            let foundList = await List.findOne({name:listTitle})
            foundList.items.push(i)
            await foundList.save()
            res.redirect("/"+listTitle)
        }
    }catch(err){
        console.log("error in finding/adding elem",err)
    }
})

app.post('/delete',async function(req,res){
    let listName = req.body.listName
    let inpId = req.body.checkbox
    try{
        if(listName==="Today"){
            await Item.findByIdAndDelete(inpId)
            res.redirect('/')
        }else{
            await List.findOneAndUpdate({name:listName},{$pull:{items:{_id:inpId}}})
            res.redirect("/"+listName)
        }
        console.log("deleted item")
    }catch(err){
        console.log("error in deleting")
    }
})

app.listen(3000,function(){
    console.log("running")
})