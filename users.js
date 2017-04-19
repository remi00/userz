const express = require('express')
const router = express.Router()
const uuid = require('uuid');
const passport = require('passport')
const fsp = require('fs-promise');
const path = require('path');
const BasicStrategy = require('passport-http').BasicStrategy;

const usersDir = './users';

passport.use(new BasicStrategy(
  (userid, password, done) => {

      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      return done(null, user);
    }
));

const userSessions = [];

// define the home page route
router.post('/register', async (req, res) => {
  const user = req.body;
  if (user.name && user.email && user.luckyNumber && user.password) {
    const session = uuid.v4();
    const writeRes = await fsp.writeFile(path.join(usersDir, `${session}.json`),
        // TODO: MD5/SHA for password whatever!
        JSON.stringify({name: user.name, email: user.email, luckyNumber: user.luckyNumber, password: user.password })
    );
    // TODO: check unique!
    userSessions.push({ email: user.email, name: user.name, file: session});
    console.log('userSessions: ', userSessions);
    res.json({ message: "User registered" });
  } else {
      res.status(400).end();
  }
});

router.post('/login', async (req, res) => {
    const login = req.body;
    if (login.email && login.password && userSessions) {
        const userSession = userSessions.find(s => (s.email === login.email));
        if (userSession) {
            let userData;
            try {
                userData = JSON.parse(await fsp.readFile(path.join(usersDir, `${userSession.file}.json`)));
                if (userData && userData.password && userData.password === login.password) {
                    const sessionId = uuid.v4();
                    userSession.session = sessionId;
                    return res.status(200).json({message: "Logged in", session: sessionId });
                }
            } catch (err) {
                console.log(err)
                return res.status(400).end();
            }
        } else {
            console.log('user not found');
            console.log('userSessions: ', userSessions);
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
    if (userSessions) {
        const userSessionIndex = userSessions.findIndex(s => s.session === auth);
        if (userSessionIndex === -1) {
            return res.status(403).end();
        }
    }
    const result = userSessions.filter((s) => {
        if ((s.email && s.email.includes(query)) || (s.name && s.name.includes(query))) {
            return true;
        }
    }).map((s) => ({
        name: s.name,
        email: s.email,
        uuid: s.file,
        points: 0,
    }))
    return res.json(result);
});


router.put('/logout', async (req, res) => {
    const auth = req.headers['x-authorization'];
    if (userSessions) {
        const userSessionIndex = userSessions.findIndex(s => s.session === auth);
        if (userSessionIndex >= 0 && userSessions[userSessionIndex].email) {
            delete userSessions[userSessionIndex];
            return res.status(200).end();
        }
        else {
            console.log('user not found');
            console.log('userSessions: ', userSessions);            
        }
    }
    return res.status(404).end();
});

//   passport.authenticate('basic', { session: false }),

module.exports = router
