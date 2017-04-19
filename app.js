const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

const users = require('./users');

app.use('/users', users);

const port = 3000;

app.listen(port, () => {
  console.log(`Users service running: http://localhost${port}`);
});
