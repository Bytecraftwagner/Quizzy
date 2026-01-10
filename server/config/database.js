const { ensureDbDir } = require("../db/index");
require("dotenv").config();

exports.connect = async () => {
    try {
        await ensureDbDir();
        console.log("JSON DB Initialized Successfully");
    } catch (error) {
        console.log("DB Connection Failed");
        console.error(error);
        process.exit(1);
    }
};