const mongoose = require("mongoose");

// User Schema...
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    notes: [{
        title: String,
        content: String
    }],
    googleId: String
});

// Email Schema...
const emailSchema = new mongoose.Schema({
    mail: String
});

// Settings Schema...
const settingSchema = new mongoose.Schema({

});

// Profile Schema...
const profileSchema = new mongoose.Schema({

});

// Exporting all created Schemas
exports.user = userSchema;
exports.mail = emailSchema;
exports.settings = settingSchema;
exports.profile = profileSchema;