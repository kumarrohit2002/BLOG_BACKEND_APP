const express = require('express');
const router = express.Router();
const { Prisma } = require('@prisma/client');

// Create Post
router.post('/', async (req, res) => {
  const { img, description, userId } = req.body;
  try {
    const post = await req.prisma.post.create({
      data: { img, description, userId },
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/user/:userId/feed', async (req, res) => {
  const { userId } = req.params;

  try {
    const feed = await req.prisma.$queryRaw`
      (
        SELECT 
          p.id,
          p.description,
          p.img,
          p.createdAt,
          p.userId,
          u.name AS authorName,
          NULL AS repostedAt,
          NULL AS repostedBy,
          FALSE AS isRepost
        FROM Post p
        JOIN User u ON u.id = p.userId
        WHERE p.userId = ${Number(userId)}
      )
      UNION ALL
      (
        SELECT 
          p.id,
          p.description,
          p.img,
          r.createdAt AS createdAt,
          p.userId,
          au.name AS authorName,
          r.createdAt AS repostedAt,
          ru.name AS repostedBy,
          TRUE AS isRepost
        FROM Repost r
        JOIN Post p ON p.id = r.postId
        JOIN User au ON au.id = p.userId        -- original author
        JOIN User ru ON ru.id = r.userId        -- reposting user
        WHERE r.userId = ${Number(userId)}
      )
      ORDER BY createdAt DESC
      LIMIT 50;
    `;

    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await req.prisma.post.findMany({
      include: {
        author: true,
        comments: {
          include: { author: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({message:'Get All Post Successfully',success:true,data:posts});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like Post
router.post('/:id/like', async (req, res) => {
  const { id } = req.params;
  const post = await req.prisma.post.update({
    where: { id: Number(id) },
    data: { likes: { increment: 1 } },
  });
  res.json(post);
});

// Repost
// Repost an existing post (record only)
router.post('/:id/repost', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    // Check if already reposted
    const existing = await req.prisma.repost.findFirst({
      where: {
        postId: Number(id),
        userId: Number(userId),
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already reposted' });
    }

    // Create a new repost record
    const repost = await req.prisma.repost.create({
      data: {
        postId: Number(id),
        userId: Number(userId),
      },
    });

    // Increment original post's repost count
    await req.prisma.post.update({
      where: { id: Number(id) },
      data: { reposts: { increment: 1 } },
    });

    res.status(201).json(repost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Add Comment to a post
router.post('/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { content, userId } = req.body;

  try {
    const comment = await req.prisma.comment.create({
      data: {
        content,
        postId: Number(id),
        userId: Number(userId),
      },
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update Post
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description, img } = req.body;
  const post = await req.prisma.post.update({
    where: { id: Number(id) },
    data: { description, img },
  });
  res.json(post);
});

// Delete Post
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await req.prisma.post.delete({ where: { id: Number(id) } });
  res.json({ message: 'Post deleted' });
});

module.exports = router;
