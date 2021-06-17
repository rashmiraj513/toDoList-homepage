require("dotenv").config();
const mongoose = require("mongoose");

// dotenv CONSTANTS...
const password = process.env.PASSWORD;
const db = process.env.DATABASE;
const user = process.env.USER;
const clusterURL = process.env.URL;

// database connection url...
// const url = "mongodb+srv://" + user + ":" + password + "@" + clusterURL + db +"?retryWrites=true&w=majority";
const url = "mongodb://localhost:27017/usersAuth";

// connecting to the database...
mongoose.connect(url, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true});
const dbConnection = mongoose.connection;


module.exports = dbConnection;