const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);


const mongoose = require("mongoose");
require("dotenv").config();

const dbConnect = () => {
    return mongoose.connect(process.env.DATABASE_URL)
        .then(() => {
            console.log("DB Connected");
        })
        .catch((err) => {
            console.log("Issue in DB Connection!!");
            console.log(err);
            process.exit(1);
        });
};

module.exports = dbConnect;