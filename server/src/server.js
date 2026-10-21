require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "MyBread" });
});

async function startServer() {
  await connectDB();

  // Register your API routes here.

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`MyBread API running on port ${port}`);
  });
}

startServer();