require("dotenv").config();
const {MongoClient} = require("mongodb");

// dotenv CONSTANTS...
const password = process.env.PASSWORD;
const db = process.env.DATABASE;
const user = process.env.USER;
const clusterURL = process.env.URL;

// database connection url...
// const url = "mongodb+srv://" + user + ":" + password + "@" + clusterURL + db +"?retryWrites=true&w=majority";



async function main() {
    
    // database connection url...
    // const url = "mongodb+srv://" + user + ":" + password + "@" + clusterURL + db +"?retryWrites=true&w=majority";
    const url = "mongodb://localhost/27017";
    const client = new MongoClient(url, {useUnifiedTopology: true, useNewUrlParser: true});

    // connecting to the database...
    try {
        // connect to the MongoDB cluster
        await client.connect().then(
            // console.log("Database connection established successfully! :-)")
        );

        // make the appropriate DB calls
        // await listDatabases(client);
    } catch(e) {
        console.error(e);
    } finally {
        await client.close().then(
            // console.log("Database closed successfully! :-(")
        );
    }
}

// main().catch(console.error);

module.exports = main;