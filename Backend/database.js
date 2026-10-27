const mongoose =require("mongoose");

async function connectDatabase() {
    const uri = process.env.MONGODB_URI;
    if(!uri) {
        throw new Error("MongoDB Connection String Missing");
    }

    await mongoose.connect(uri, {serverSelectionTimeoutMS: 5000});
    console.log("MongoDB Connect");
}

module.exports = {connectDatabase};