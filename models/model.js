const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    notes: [String],
    googleId: String
});

const User = new mongoose.model("User", userSchema);

const emailSchema = new mongoose.Schema({
    mail: String
})


const Mail = new mongoose.model("Mail", emailSchema);

exports.user = User;
exports.mail = Mail;