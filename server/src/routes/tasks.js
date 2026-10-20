const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");

const router = express.Router();

// GET /api/tasks - Read all tasks
router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Create a task
router.post("/", async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "A task title is required",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description:
        typeof description === "string" ? description : "",
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id - Update completion status
router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    if (typeof req.body.completed !== "boolean") {
      return res.status(400).json({
        message: "completed must be a boolean",
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { completed: req.body.completed } },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;