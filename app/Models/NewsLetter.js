const mongoose = require('mongoose');

const NewsLetterSchema = new mongoose.Schema({
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
}, {collection: 'news-letter-emails'});

module.exports = mongoose.model('NewsLetter', NewsLetterSchema)
