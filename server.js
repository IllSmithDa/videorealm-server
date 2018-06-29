const express = require('express');

const server = express();
const port = 3031;

server.listen(port, () => {
  console.log(`server listening on port ${port}`);
})