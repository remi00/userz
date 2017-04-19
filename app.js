
const express = require('express')
const router = express.Router()
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json
// app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const users = require('./users');

// ...

app.use('/users', users)

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
