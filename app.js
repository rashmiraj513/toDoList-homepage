const express = require("express");
const ejs = require("ejs");
const passport = require("passport");
const bcrypt = require("bcrypt");
// database connection module...
const main = require("./connection/db");

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

// database connection module...
main().catch(console.error);

app.get("/", function(req, res) {
    res.render("home");
})

app.listen(process.env.PORT || 3000, function() {
    console.log("Server is started on port 3000.");
})