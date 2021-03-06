import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import setRoutes from './routes';
import {Strategy, ExtractJwt} from 'passport-jwt';
import github from 'passport-github';
import passport from 'passport';
import User from './models/user';


var swaggerJsdoc = require("swagger-jsdoc");
var  swaggerUi = require("swagger-ui-express");


const jwtOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
  secretOrKey: process.env.SECRET_TOKEN
};

const app = express();

// Register JWT Strategy
passport.use(new Strategy(jwtOpts, (jwtPayload, done) => {
  // console.log(JSON.stringify(jwtPayload));
  User.findOne({_id: jwtPayload.user._id})
    .then((user) => done(null, user))
    .catch(done);
}));

// Register GitHub Strategy
passport.use(new github.Strategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHIB_CALLBACK_URL,
    session: false,
    scope: 'user:email'
  },
  (accessToken, refreshToken, profile, done) =>
    User.findOrCreate(profile).then(user => done(null, user)).catch(done)
  )
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
  res.header('Access-Control-Allow-Credentials', 'true');
  if ('OPTIONS' === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

import getSwagger from "./swaggerdef";

var swaggerDefinition = getSwagger();

const options = {
  swaggerDefinition,
  // Path to the API docs
  apis: ['./server/routes.ts','./server/routes/users.ts','./server/routes/trips.ts'],

}

const specs = swaggerJsdoc(options);


app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});


app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
);

app.use(morgan('dev'));

setRoutes(app, passport);
console.log('Registered Routes');
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});



export {app};
