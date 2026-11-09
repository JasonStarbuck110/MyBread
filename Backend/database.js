const mongoose = require("mongoose");
var connectionPromise = null;

async function connectDatabase() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectionPromise) {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error("MONGODB_URI is missing");
        }

        connectionPromise = mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 1,
            minPoolSize: 0
        }).catch((error) => {
            connectionPromise = null;
            throw error;
        });
    }

    await connectionPromise;
    return mongoose.connection;
}

module.exports = { connectDatabase }