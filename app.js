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

passport.use(new GoogleStrategy ({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "https://enigmatic-citadel-84452.herokuapp.com/auth/google/dashboard",
        // callbackURL: "http://localhost:3000/auth/google/dashboard",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
        });
    }
));

// Variables for render messages...
let successMessage = "";
let messages = "";

app.get("/", function(req, res) {
    res.render("home", {message: successMessage});
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ["profile"] }
));

app.get('/auth/google/dashboard', 
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect("/dashboard");
});

app.get("/login", function(req, res) {
    res.render("login", {errorMessages: messages});
});

app.get("/forgot_password", function(req, res) {
    res.render("forgot_password");
})

app.get("/privacy_policy", function(req, res) {
    res.render("privacy_policy");
});

app.get("/terms_of_use", function(req, res) {
    res.render("terms_service");
});

app.get("/signup", function(req, res) {
    res.render("signup", {errorMessages: messages});
});

app.get("/about", function(req, res) {
    res.render("about");
})

app.get("/dashboard", function(req, res) {
    if(req.isAuthenticated()) {
        User.find({username: req.user.username}, function(err, user) {
            if(err) {
                console.log(err);
            } else {
                const allNotes = user[0].notes;
                res.render("dashboard", {allNote: allNotes});
            }
        });
        // res.render("dashboard");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/login");
});

app.get("/profile", function(req, res) {
    if(req.isAuthenticated()) {
        res.send("Profile Work in progress!");
    } else {
        res.redirect("/login");
    }
});

app.get("/settings", function(req, res) {
    if(req.isAuthenticated()) {
        res.send("Settings Work in progress!");
    } else {
        res.redirect("/login");
    }
});

app.get("/create_note", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("create_note");
    } else {
        res.redirect("/login");
    }
});

app.get("/notes/:notesID", function(req, res) {
    const requestedNotesId = req.params.notesID;
    if(req.isAuthenticated()) {
        User.find({username: req.user.username}, function(err, user) {
            if(err) {
                console.log(err);
            } else {
                user[0].notes.forEach(function(element) {
                    if(element.id === requestedNotesId) {
                        res.render("notes", {title: element.title, content: element.content});
                    }
                });
            }
        });
    }
});

app.post("/", function(req, res) {
    Mail.findOne({mail: req.body.userEmail}, function(err, foundEmail) {
        if(err) {
            console.log(err);
        } else {
            if(foundEmail) {
                successMessage = "This Email is already in our database.";
                res.render("home", {message: successMessage});
                successMessage = "";
            } else {
                const newMail = new Mail({mail: req.body.userEmail});
                newMail.save(function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        successMessage = "Added successfully in our database!";
                        res.render("home", {message: successMessage});
                        successMessage = "";
                    }
                });
            }
        }
    });
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
                    res.render("signup", {errorMessages: messages});
                    messages = "";
                } else {
                    User.register({username: username}, password, function(err, user) {
                        if(err) {
                            console.log(err);
                            res.redirect("/signup");
                        } else {
                            passport.authenticate("local") (req, res, function() {
                                messages = "Sign up successfully, Please login here!";
                                res.redirect("/login");
                            });
                        }
                    });
                }
            }
        });
    } else {
        messages = "Password should be at least 6 characters long!";
        res.render("signup", {errorMessages: messages});
        messages = "";
    }
});

app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    if(password.length >= 6) {
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
                            passport.authenticate("local") (req, res, function(err) {
                                if(err) {
                                    res.send("Password is incorrect!");
                                } else {
                                    res.redirect("/create_note");
                                }
                            });
                        }
                    });
                } else {
                    messages = "Email is not registered!";
                    res.render("login", {errorMessages: messages});
                    messages = "";
                }
            }
        });
    } else {
        messages = "Password should be at least 6 characters long!";
        res.render("login", {errorMessages: messages});
        messages = "";
    }
});

app.post("/forgot_password", function(req, res) {
    const forgotMail = req.body.username;
    User.findOne({username: forgotMail}, function(err, foundMail) {
        if(err) {
            console.log(err);
        } else {
            if(foundMail) {
                res.send("Mail found!");
            } else {
                res.send("Not registered yet! Please enter registered Mail!");
            }
        }
    });
});

app.post("/create_note", function(req, res) {
    const title = req.body.titleContent;
    const content = req.body.noteContent;

    if(req.isAuthenticated()) {
        const newNote = { title: title, content: content };

        User.find({username: req.user.username}, function(err, user) {
            if(err) {
                console.log(err);
            } else {
                // console.log(user[0].notes);
                user[0].notes.push(newNote);
                user[0].save(function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        res.redirect("/dashboard");
                    }
                });
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log("Server is started on port 3000.");
});