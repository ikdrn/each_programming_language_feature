const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Node.js + Express',
    timestamp: new Date().toISOString(),
    framework: 'Express',
  });
});

app.get('/api/data', (req, res) => {
  res.json({
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      value: Math.random() * 100,
    })),
  });
});

app.post('/api/echo', (req, res) => {
  res.json({
    echo: req.body,
    received: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
