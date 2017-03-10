const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const app = express();

// Fake user database
let users = [
  {
    id: 1,
    username: 'user1',
    password: 'password'
  },
  {
    id: 2,
    username: 'user2',
    password: 'password'
  }
];

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: 'supersecret',
  ignoreExpiration: false
};

const strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
  console.log('payload received', jwt_payload);

  var user = users[_.findIndex(users, { id: jwt_payload.id })];
  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});

passport.use(strategy);

app.use(passport.initialize());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!'
  })
});

const authorize = passport.authenticate('jwt', { session: false });

app.get('/users', authorize, (req, res) => {
  res.json(users);
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // usually this would be a database call:
  const user = users[_.findIndex(users, { username: username })];

  if (!user) {
    res.status(401).json({ message: "no such user found" });
  }

  if (user.password === password) {
    // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
    const payload = { id: user.id };
    const token = jwt.sign(payload, jwtOptions.secretOrKey);
    res.json({ message: "ok", token: token });
  } else {
    res.status(401).json({ message: "passwords did not match" });
  }
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
