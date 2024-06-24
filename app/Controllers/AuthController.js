const User = require('../Models/User')
const UserData = require('../Models/UserData')
const bcrypt = require("bcryptjs");
const VerificationToken = require("../Models/VerificationToken");
const crypto = require("crypto");
const sendEmail = require("../../email");
const sendResetEmail = require("../../reset-email");
const {StatusCodes} = require("http-status-codes");
const {BadRequestError, UnauthenticatedError} = require("../../errors");
const jwt = require('jsonwebtoken');
const {lookup} = require('geoip-lite');
const moment = require("moment/moment");

const JWTregister = async (req, res, next) => {
    try {
        const {name, email, password} = req.body
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const user = await new User({
            name: name,
            email: email,
            password: hashedPassword
        }).save()
        console.log(user)
        let verificationToken = await new VerificationToken({
            userId: user._id,
            token: crypto.randomBytes(32).toString("hex"),
        }).save();
        const verificationLink = `${process.env.BASE_URL}/rauth/verify/${user.id}/${verificationToken.token}`;
        console.log(verificationLink)
        await sendEmail('SuAir@gmail.com', "Verification Email for SuAir", user.email, verificationLink);
        res.status(StatusCodes.CREATED).send(`User created, email has been sent to your account ${user.email}`)
    } catch (error) {
        next(error)
        console.log(error)
    }
}
const JWTverify = async (req, res) => {
    try {
        const user = await User.findOne({_id: req.params.id});
        console.log(user)
        if (!user) return res.status(400).send("Invalid link");
        const token = await VerificationToken.findOne({
            userId: user._id,
            token: req.params.token,
        });
        console.log(token)
        if (!token) return res.status(400).send("Invalid link");
        await user.updateOne({verified: true});
        await VerificationToken.findByIdAndRemove(token._id);
        console.log('Email verified successfully')
        // res.redirect('/user-verified');//React login page goes here
        res.send('You have been verified');//React login page goes here
    } catch (error) {
        res.status(400).redirect('/login?e=error-message');//React login page goes here
        // res.status(400).send("An error occurred");
        console.log(error)
    }
}

const JWTlogin = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            throw new BadRequestError('Please provide email and password')
        }
        const user = await User.findOne({email: email, verified: true});
        console.log(user)
        if (!user) {
            throw new UnauthenticatedError('Invalid credentials')
        }
        const isPasswordCorrect = await user.comparePassword(password)
        if (!isPasswordCorrect) {
            throw new UnauthenticatedError('Invalid credentials')
        }
        const secret_key = process.env.JWT_SECRET
        if (user && isPasswordCorrect) {
            const token = jwt.sign({id: user._id, name: user.name, email: user.email}, secret_key, {expiresIn: '1d'});
            const user_data = await log_user_data(user);
            res.status(200).json({token});
        } else {
            res.status(401).json({message: 'Invalid email or password'});
        }
    } catch (error) {
        next(error)
    }

    async function log_user_data(user) {
        // const ip_address = req.headers['x-forwarded-for']
        const ip_address = (req.clientIp ? req.clientIp : '178.222.164.42')
        // const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim()
        console.log('THIS IS THE IP ADDRESS', ip_address)
        const login_time = moment().format('YYYY-MM-DDTHH:mm:ssZ');
        const device_type = req.device.type
        const user_agent = req.get('User-Agent');
        const language = req.headers["accept-language"];
        const geo_data = lookup(ip_address)
        console.log('THIS IS THE GEO_DATA', geo_data)
        return await new UserData({
            range: geo_data.range[0],
            user_id: user.id,
            login_time: login_time,
            country: geo_data.country,
            device_type: device_type,
            user_agent: user_agent,
            language: language,
            ip_address: ip_address,
            region: geo_data.region,
            is_in_eu: geo_data.eu,
            timezone: geo_data.timezone,
            city: geo_data.city,
            latitude_longitude: geo_data.ll,
            metro_area_code: geo_data.metro,
            radius_around_lat_lon: geo_data.area
        }).save();
    }
}

const JWTforgotPassword = async (req, res, next) => {
    try {
        const {email} = req.body;
        const user = await User.findOne({email: email});
        if (!user) {
            throw new UnauthenticatedError('User not found')
        }
        let resetToken = await new VerificationToken({
            userId: user._id,
            token: crypto.randomBytes(32).toString("hex"),
        }).save();
        const resetLink = `${process.env.BASE_URL}/rauth/reset-pass/${user.id}/${resetToken.token}`;
        console.log(resetLink)
        await sendResetEmail('SuAir@gmail.com', "Reset Password for SuAir", user.email, resetLink);
        res.status(StatusCodes.OK).send(`Reset password link has been sent to your account ${user.email}`)
    } catch (error) {
        next(error)
        console.log(error)
    }
}

const ResetPassword = async (req, res, next) => {
    try {
        const user_id = req.params['userId']
        const reset_token = req.params['resetToken']
        // Check the database for the user id and reset token
        const user = await User.findOne({_id: user_id});
        const reset_token_DB = await VerificationToken.findOne({token: reset_token});

        if (user && reset_token_DB) {
            // Generate an HTML form for resetting the password
            res.status(200).send(`
                <form action="/rauth/set-new-pass" method="POST">
                    <input type="hidden" name="userId" value="${user_id}" />
                    <input type="hidden" name="resetToken" value="${reset_token}" />
                    <label for="password">New Password:</label>
                    <input type="password" name="password" id="password" required />
                    <input type="submit" value="Reset Password" />
                </form>
            `);
        } else {
            // Generate an error message
            res.status(400).send("Invalid user id or reset token");
        }
    } catch (error) {
        console.log(error)
    }
}

const SetNewPass = async (req, res, next) => {
    try {
        const user_id = req.body.userId;
        const reset_token = req.body.resetToken;
        const new_password = req.body.password;
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(new_password, salt)
        // Check the database for the user id and reset token
        const user = await User.findOne({_id: user_id});
        if (user) {
            // Update the user's password in the database
            user.password = hashedPassword;
            await user.save();
            // Send a success message
            res.status(200).send("Password updated successfully");
        } else {
            // Send an error message
            res.status(400).send("Invalid user id or reset token");
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    JWTlogin, JWTverify, JWTregister, JWTforgotPassword, ResetPassword, SetNewPass
}