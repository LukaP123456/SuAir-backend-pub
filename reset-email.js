const nodemailer = require("nodemailer");
require("dotenv").config();
const ejs = require('ejs');
const fs = require('fs');

const sendResetEmail = async (email, subject, to, resetLink) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'lpbudgeting987@gmail.com',
                pass: 'ayaweqowerfvzosp',
            },
        });
        fs.readFile(__dirname + '/Views/reset_pass.ejs', 'utf8', async (err, data) => {
            if (err) {
                console.log(err);
            } else {
                let template = ejs.compile(data);
                let html = template({resetLink: resetLink});
                let mailOptions = {
                    from: email,
                    to: to,
                    subject: subject,
                    html: html
                };
                await transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        console.log("Reset password email sent successfully");
                    }
                });
            }
        });
    } catch (error) {
        console.log("Reset password email not sent");
        console.log(error);
    }
};

module.exports = sendResetEmail;