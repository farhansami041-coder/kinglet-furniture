const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(302, { Location: `http://localhost:5174${req.url}` });
  res.end();
});

server.listen(5173, () => {
  console.log('Redirecting http://localhost:5173 -> http://localhost:5174');
});

