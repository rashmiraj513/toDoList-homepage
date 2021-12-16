require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const CLIENT_ID = process.env.CLIENT_ID_GOOGLE;
const CLIENT_SECRET = process.env.CLIENT_SECRET_GOOGLE;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN_GOOGLE;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});

async function sendMail() {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transport = nodemailer.createTransport ({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "rashmiraj7877@gmail.com",
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken
            }
        });

        const mailOptions = {
            from: "NoteTaker <rashmiraj7877@gmail.com>",
            to: forgotEmail,
            subject: "Forgot Password for NoteTaker",
            text: "Forgot Password",
            html: '<div style="padding:3% 8%"><table style="width:100%;"><h1>NoteTaker</h1><h2 style="color:#00a82d;">Change Your Password</h2><h3>We have received a password change request for your NoteTaker account.</h3><h3 style="line-height:1.7rem;">If you did not ask to change your password, then you can ignore this email and your password will not be changed. The link below will remain active for 1 hours.</h3><a href="https://glacial-refuge-24169.herokuapp.com/change_password"><button style="background-color:#00a82d;border:1px solid #00a82d;border-radius:4px;color:#ffffff;display:inline-block;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;line-height:35px;text-align:center;text-decoration:none;padding:0 25px 0 25px;letter-spacing:.5px;min-width:150px;cursor:pointer">Reset Password</button></a></table></div>'
        };
        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (err) {
        return err;
    }
}

let forgotEmail = "";

// exported modules...
const db = require("./connection/config");          // dbConnection Module
const schemas = require("./models/model");          // Schema Module

const userSchema = schemas.user;
const mailSchema = schemas.mail;

const app = express();

app.use(express.static(__dirname +"/public"));
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
let requestedNotesId = "";

app.get("/", function(req, res) {
    res.render("home", {message: successMessage});
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

app.get("/create_note", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("create_note");
    } else {
        res.redirect("/login");
    }
});

app.get("/notes/:notesID", function(req, res) {
    requestedNotesId = req.params.notesID;
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

app.get("/delete", function(req, res) {
    if(req.isAuthenticated()) {
        // console.log(req.user.password);
        User.find({username: req.user.username}, function(err, user) {
            if(err) {
                console.log(err);
            } else {
                user[0].notes.forEach(function(element, index) {
                    if(element.id === requestedNotesId) {
                        user[0].notes.splice(index, 1);
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
    }
});

app.get("/update", function(req, res) {
    if(req.isAuthenticated()) {
        User.find({username: req.user.username}, function(err, user) {
            if(err) {
                console.log(err);
            } else {
                user[0].notes.forEach(function(element) {
                    if(element.id === requestedNotesId) {
                        res.render("update", {title: element.title, content: element.content});
                    }
                });
            }
        });
    }
});

app.get("/change_password", function(req, res) {
    res.render("change_password");
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
                forgotEmail = foundMail.username;
                sendMail().then(result => console.log(result))
                .catch(err => console.log(err));
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

app.post("/update", function(req, res) {
    const updatedTitle = req.body.updateTitleContent;
    const updatedContent = req.body.updateNoteContent;
    if(req.isAuthenticated()) {
        User.find({username: req.user.username}, function(err, user) {
            if(err) {
                console.log(err);
            } else {
                user[0].notes.forEach(function(element) {
                    if(element.id === requestedNotesId) {
                        element.title = updatedTitle;
                        element.content = updatedContent;
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
    }
});

app.post("/change_password", function(req, res) {
    const newPassword = req.body.resetPassword;
    User.find({username: forgotEmail}, function(err, user) {
        if(err) {
            console.log(err);
        } else {
            console.log(newPassword);
            user[0].setPassword(newPassword, function(err, user) {
                if(err) {
                    console.log(err);
                } else {
                    res.redirect("/login");
                }
            });
        }
    })
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log(`Server is started on port ${PORT}.`);
});