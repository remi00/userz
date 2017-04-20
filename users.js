const express = require('express');
const uuid = require('uuid');
const passport = require('passport');
const fsp = require('fs-promise');
const path = require('path');
const BasicStrategy = require('passport-http').BasicStrategy;
const crypto = require('crypto');

const router = express.Router();

const usersDir = './users';

// this relies on nodejs' caching mechanism for dependencies resolved with require()
// ie. we know it is executed only once, if this module was required multiple times
let userSessions = null;

(async () => {
  const files = await fsp.readdir(usersDir);
  Promise.all(files
    // ignore no json files
    .filter(f => f.endsWith('.json'))
    // produce promises for reading the files
    .map(f => fsp.readJson(path.join(usersDir, f))))
    // once all is read, initialize the global dictionary
    .then(us => (userSessions = us));
})();

// a middleware to prevent access while JSON files are being read (initalization of a service)
router.use((req, res, next) => {
  if (userSessions === null) {
    return res.status(202).json({ message: 'Please try again, service initialization in progress' });
  }
  return next();
});

// define the home page route
router.post('/register', async (req, res) => {
  const user = req.body;

  if (!user.name || !user.email || !user.luckyNumber || !user.password) {
    return res.status(400).json({ message: 'Missing required parameter(s)' });
  }

  if (userSessions.find(s => s.email === user.email)) {
    return res.status(400).json({ message: 'Duplicate email' });
  }

  if (userSessions.find(s => s.luckyNumber === user.luckyNumber)) {
    return res.status(400).json({ message: 'Duplicate lucky number' });
  }


  const userFile = uuid.v4();
  const hash = crypto.createHash('sha256');
  hash.update(user.password);

  await fsp.writeJson(path.join(usersDir, `${userFile}.json`), {
    name: user.name,
    email: user.email,
    luckyNumber: user.luckyNumber,
    password: hash.digest('hex'),
  });

  userSessions.push({
    email: user.email,
    name: user.name,
    luckyNumber: user.luckyNumber,
    file: userFile,
  });
  return res.json({ message: 'User registered' });
});

router.post('/login', async (req, res) => {
  const login = req.body;
  if (login.email && login.password) {
    const userSession = userSessions.find(s => (s.email === login.email));
    if (userSession) {
      let userData;
      try {
        userData = await fsp.readJson(path.join(usersDir, `${userSession.file}.json`));
        const hash = crypto.createHash('sha256');
        hash.update(login.password);

        if (userData && userData.password && userData.password === hash.digest('hex')) {
          const sessionId = uuid.v4();
          userSession.session = sessionId;
          return res.status(200).json({ message: 'Logged in', session: sessionId });
        }
      } catch (err) {
        console.log(err);
        return res.status(400).end();
      }
    }
  }
  return res.status(403).end();
});

router.post('/search', async (req, res) => {
  const auth = req.headers['x-authorization'];
  const query = req.body.query;
  if (!query) {
    return res.status(400).end();
  }

  const userSessionIndex = userSessions.findIndex(s => s.session === auth);
  if (userSessionIndex === -1) {
    return res.status(403).end();
  }

  const result =
    userSessions
    .filter(s =>
      ((s.email && s.email.includes(query)) || (s.name && s.name.includes(query))))
    .map(s => ({
      name: s.name,
      email: s.email,
      uuid: s.file,
      points: 0,
    }));
  return res.json(result);
});


router.put('/logout', async (req, res) => {
  const auth = req.headers['x-authorization'];
  const userSessionIndex = userSessions.findIndex(s => s.session === auth);
  if (userSessionIndex >= 0 && userSessions[userSessionIndex].email) {
    delete userSessions[userSessionIndex];
    return res.status(200).end();
  }
  return res.status(404).end();
});

//   passport.authenticate('basic', { session: false }),

module.exports = router;

