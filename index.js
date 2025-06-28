const express = require('express');
const { PrismaClient } = require('@prisma/client');
const userRoutes = require('./src/routes/userRoutes');
const postRoutes = require('./src/routes/postRoutes');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.get('/',(req,res)=>{
    res.send('Server is running');
})

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
