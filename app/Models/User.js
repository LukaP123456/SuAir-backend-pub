const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        minlength: 1,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'Please provide a email'],
        minlength: 5,
        maxlength: 50,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
        unique: true,
    },
    password: {
        type: String,
        // required: [true, 'Please provide a password'],
        minlength: 6,
    },
    verified: {
        type: Boolean,
        default: false
    },
    googleID: {
        type: String,
        default: null,
    },
    favoriteHour: [{type: mongoose.Types.ObjectId, ref: 'HourMeasurement'}],
    favoriteDay: [{type: mongoose.Types.ObjectId, ref: 'DayMeasurement'}],
    favoriteMonth: [{type: mongoose.Types.ObjectId, ref: 'MonthMeasurement'}],
    websites: [String],
}, {collection: 'Users'})

//const user = await User.create({...req.body})
// UserSchema.pre('save', async function () {
//     const salt = await bcrypt.genSalt(10)
//     this.password = await bcrypt.hash(this.password, salt)
// })

UserSchema.methods.createJWT = function () {
    return jwt.sign({userId: this._id, name: this.name}, process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_LIFETIME})
}

UserSchema.methods.comparePassword = async function (candidatePassword) {
    const googleId = this.googleID
    if (googleId) {
        throw new Error('Cannot compare password for user with googleID please user google auth to login');
    }
    return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', UserSchema)