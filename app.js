require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
// exported modules...
const db = require("./connection/config");          // dbConnection Module
const schemas = require("./models/model");          // Schema Module

const userSchema = schemas.user;
const mailSchema = schemas.mail;

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(session ({
    secret: "Our Truth.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// User and Mail models...
const User = new mongoose.model("User", userSchema);
const Mail = new mongoose.model("Mail", mailSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

// Variables for render messages...
let successMessage = "";
let messages = "";
let passwordMessage = "";

app.get("/", function(req, res) {
    res.render("home", {message: successMessage});
});

app.get("/login", function(req, res) {
    res.render("login", {errorMessages: messages, passwordErrorMessage: passwordMessage});
});

app.get("/signup", function(req, res) {
    res.render("signup", {errorMessages: messages, passwordErrorMessage: passwordMessage});
});

app.get("/dashboard", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("dashboard");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/login");
});

app.post("/signup", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    if(password.length >= 6) {
        User.findOne({username: username}, function(err, foundRegisteredUser) {
            if(err) {
                console.log(err);
            } else {
                if(foundRegisteredUser) {
                    messages = "Email is already registered!";
                    res.redirect("/signup");
                } else {
                    User.register({username: username}, password, function(err, user) {
                        if(err) {
                            console.log(err);
                            res.redirect("/signup");
                        } else {
                            passport.authenticate("local") (req, res, function() {
                                res.redirect("/dashboard");
                            });
                        }
                    });
                }
            }
        });
    } else {
        passwordMessage = "Password should be at least 6 characters long!";
        res.redirect("/signup");
    }
});

app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({username: username}, function(err, registeredUser) {
        if(err) {
            console.log(err);
            res.redirect("/login")
        } else {
            if(registeredUser) {
                const user = new User({
                    username: req.body.username,
                    password: req.body.password
                });
                req.login(user, function(err) {
                    if(err) {
                        console.log(err);
                        res.redirect("/login");
                    } else {
                        passport.authenticate("local") (req, res, function() {
                            res.redirect("/dashboard");
                        });
                    }
                });
            } else {
                messages = "Email is not registered!";
                res.redirect("/login");
            }
        }
    })
    // const user = new User({
    //     username: req.body.username,
    //     password: req.body.password
    // });
    // req.login(user, function(err) {
    //     if(err) {
    //         console.log(err);
    //     } else {
    //         passport.authenticate("local") (req, res, function() {
    //             res.redirect("/dashboard");
    //         });
    //     }
    // });
});

app.post("/mails", function(req, res) {
    Mail.findOne({mail: req.body.userEmail}, function(err, foundEmail) {
        console.log(foundEmail);
        if(err) {
            console.log(err);
        } else {
            if(foundEmail) {
                successMessage = "This Email is already in our database.";
                res.redirect("/");
            } else {
                const newMail = new Mail({mail: req.body.userEmail});
                newMail.save(function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        successMessage = "Added successfully in our database!";
                        res.redirect("/");
                    }
                });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function(req, res) {
    console.log(`Server is started at ${PORT}.`);
})