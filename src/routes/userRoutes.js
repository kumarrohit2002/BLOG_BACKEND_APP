const express = require('express');
const router = express.Router();

// Create User
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await req.prisma.user.create({
      data: { name, email },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Users
router.get('/', async (req, res) => {
  const users = await req.prisma.user.findMany({
    include: { posts: true },
  });
  res.json(users);
});

module.exports = router;
