const express = require("express");
const ejs = require("ejs");
const passport = require("passport");
const bcrypt = require("bcrypt");
// database connection module...
const main = require("./connection/db");
// user module file...
const createdModule = require("./models/model");


// user module...
// const userModule = createdModule.user;

// mail module...
const mailModule = createdModule.mail;

const newMail = new mailModule({
    mail: "rashmiraj7877@gmail.com"
});

console.log(newMail);


const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

// database connection module...
main().catch(console.error);

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/signup", function(req, res) {
    res.render("signup");
})

app.post("/mails", function(req, res) {
    res.send("Mails post is in process!");
})

app.listen(process.env.PORT || 3000, function() {
    console.log("Server is started on port 3000.");
})