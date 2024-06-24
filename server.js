const express = require('express');
const server = express();
const device = require('express-device');
const session = require('express-session')
const MongoStore = require('connect-mongo');
const cron = require("node-cron");
const schedule = require('node-schedule');
//CRON JOB
const get_hourly_data = require('./Jobs/get_hourly_data')
const get_daily_data = require('./Jobs/get_daily_data')
const get_monthly_data = require('./Jobs/get_monthly_data')
const get_current_data = require('./Jobs/get_current_data')
const scrape_districts = require('./Jobs/one-time-use/webscrape_districts')
const passport = require('passport');
const connectDB = require('./DB/connect')
const InvalidToken = require('./app/Models/InvalidToken')
require("dotenv").config();
const InitializePassport = require('./passport-config')
//ERROR HANDLERS CALL
const notFoundMiddleware = require('./middleware/not_found');
const errorHandlerMiddleware = require('./middleware/error_handler');
const AuthRoutes = require('./Routes/AuthRoutes')
const ProtectedAuthRoutes = require('./Routes/ProtectedAuthRoutes')
const DistrictRoutes = require('./Routes/DistrictRoutes')
const AQIRoutes = require('./Routes/AQIRoutes')
const NewsLetterRoutes = require('./Routes/NewsLetterRoutes')
const WebsiteRoutes = require('./Routes/WebsiteRoutes')
//SWAGGER
const swaggerUI = require('swagger-ui-express')
const YAML = require('yamljs')
const swaggerDocument = YAML.load('./swagger.yaml')
//EXTRA SECURITY
const flash = require('express-flash')
const helmet = require('helmet')
const cors = require('cors')
const xss = require('xss-clean')
const rateLimiter = require('express-rate-limit')
const async = require('async');
const {checkFavoriteSites} = require("./app/Controllers/WebsiteController");

const requestIp = require('request-ip')
server.use(requestIp.mw())


// -------------------------------------MIDDLEWARES START-------------------------------------
server.use(express.json()); // for parsing JSON bodies
server.use(express.urlencoded({extended: true})); // for parsing URL-encoded bodies
// Code below causes a memory leak when it runs on server?
server.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({mongoUrl: process.env.MONGO_ATLAS_URL})
}));
server.use(passport.initialize());
server.use(passport.session());
//RATE LIMITER, LIMIT NO OF API CALLS
server.set('trust proxy', 1)
server.use(
    rateLimiter({
        windowMs: 15 * 6 * 1000,//15 minutes
        max: 100 //limit each IP to 199 request per windowMs
    })
)
server.use(helmet())
const corsOptions = {
    origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:8081',
        'exp+su-air-mobile://expo-development-client/?url=http%3A%2F%2F192.168.0.133%3A8081',
        'https://suair-backend-production.up.railway.app/',
        'https://suair.onrender.com/',
        'com.nemanja.mitric.suairmobile',
    ],//<-- FRONTEND URL GOES HERE
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200,
}
// const corsOptions = {
//     origin: [
//         '*',
//     ],//<-- FRONTEND URL GOES HERE
//     credentials: true,            //access-control-allow-credentials:true
//     optionSuccessStatus: 200,
// }
server.use(cors(corsOptions))
server.use(xss())
server.use(flash())
server.use(device.capture());
// -------------------------------------MIDDLEWARES END-------------------------------------
InitializePassport()

async function isLoggedIn(req, res, next) {
    console.log('YOU ARE IN isLoggedIn')
    if (req.isAuthenticated()) {
        return next();
    }
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1].trim();
        const invalidToken = await InvalidToken.findOne({token: token});
        if (invalidToken) {
            res.redirect('/')
        }
        return next();
    }
}

// -------------------------------------ROUTES START-------------------------------------
server.use('/rauth', AuthRoutes)
server.use('/rauth-logout', isLoggedIn, ProtectedAuthRoutes)
server.use('/districts', isLoggedIn, DistrictRoutes)
server.use('/AQI', isLoggedIn, AQIRoutes)
server.use('/newsletter', isLoggedIn, NewsLetterRoutes)
server.use('/website-check', checkFavoriteSites)
server.use('/website', isLoggedIn, WebsiteRoutes)
server.get('/test', (req, res) => {
    res.send("test")
})
// const listEndpoints = require('express-list-endpoints');
// console.log(listEndpoints(server));

// -------------------------------------GOOGLE AUTH ROUTES START-------------------------------------
server.get('/', (req, res) => {
    res.send('<a href="/auth/google">Authenticate with Google </a>')
})
server.get('/protected', isLoggedIn, (req, res) => {
    console.log(req.user)
    res.send(`Hello ${req.user.name}`)
})
server.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile']}))
server.get('/google/callback', passport.authenticate('google', {failureRedirect: '/auth/failure'}), (req, res) => {
    // Successful authentication
    res.json({token: "Bearer " + req.user});
});
server.get('/auth/failure', (req, res) => {
    res.send('Something went wrong')
})
server.get('/logout', (req, res) => {
    req.logout()
    res.send('Goodbye')
})

// -------------------------------------GOOGLE AUTH ROUTES END-------------------------------------
server.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument))
// -------------------------------------ROUTES END-------------------------------------

server.use(notFoundMiddleware);
server.use(errorHandlerMiddleware);
const port = process.env.PORT

const start = async () => {
    try {
        await connectDB(process.env.MONGO_ATLAS_URL)
        server.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};
start();
//CRON JOBS
//QUE to make sure one cron job runs at a time
// const que = async.queue(async (task, callback) => {
//     // This function will be called for each task in the queue
//     // `task` is an object representing the cron job to run
//     // `callback` is a function that must be called when the task is complete
//     // Connect to mongoose before running the cron job
//     try {
//         const mongoose = require('mongoose');
//         await mongoose.connect(process.env.MONGO_ATLAS_URL);
//         await task.job();
//     } catch (error) {
//         console.error(`Error executing task: ${error}`);
//     } finally {
//         await mongoose.disconnect();
//         callback();
//     }
// }, 1); // Set the concurrency to 1 to ensure that only one task runs at a time
//Test cron jobs
// cron.schedule('*/5 * * * * *', async () => {
//     // get_hourly_data(true)
//     que.push({job: get_hourly_data(true)});
// });
// cron.schedule('*/5 * * * * *', async () => {
//     // get_hourly_data(true)
//     get_hourly_data(true)
// });
// cron.schedule('*/30 * * * * *', async () => {
//     // get_daily_data(true)
//     // que.push({job: get_daily_data(true)});
//     get_daily_data(true)
// });
// cron.schedule('*/50 * * * * *', async () => {
//     // get_monthly_data(true)
//     // que.push({job: get_monthly_data(true)});
//     get_monthly_data(true)
// });

// console.log('========TIME 4 DISTRICTS========')
// scrape_districts()

cron.schedule('0 */3 * * *', () => {
//This cron job needs to run every 3 hours (it should run every hour) in order to get the current data which we need to show on the front page
//     que.push({job: get_current_data()});
    get_current_data()
    console.log('Running every hour');
});
cron.schedule('0 0 */2 * *', () => {
    // que.push({job: get_hourly_data()});
    get_hourly_data()
    console.log('Running every 48 hours');
});
cron.schedule('0 4 1 * *', () => {
    // que.push({job: get_daily_data()});
    get_daily_data()
    console.log('running a task on the first day of every month at 4:00 AM');
});
cron.schedule('0 2 1 */3 *', () => {
    // que.push({job: get_monthly_data()});
    get_monthly_data()
    console.log('Running every three months on the first day of the month at 2:00 AM');
});