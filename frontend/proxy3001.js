const http = require('http');

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:3000'
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Dev server connecting: ' + err.message);
  });

  req.pipe(proxyReq, { end: true });
});

server.on('upgrade', (req, socket, head) => {
  const proxySocket = http.request({
    hostname: '127.0.0.1',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:3000'
    }
  });

  proxySocket.on('upgrade', (proxyRes, targetSocket, proxyHead) => {
    let headerStr = `HTTP/1.1 101 Switching Protocols\r\n`;
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      headerStr += `${key}: ${value}\r\n`;
    }
    headerStr += '\r\n';
    socket.write(headerStr);
    targetSocket.pipe(socket);
    socket.pipe(targetSocket);
  });

  proxySocket.on('error', () => {
    socket.destroy();
  });

  proxySocket.end();
});

server.listen(3001, () => {
  console.log('Dual-port proxy active: http://localhost:3001 -> http://localhost:3000');
});
