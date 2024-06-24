const express = require('express')
const router = express.Router()
const {
    JWTlogin, JWTverify, JWTregister, JWTforgotPassword, ResetPassword, SetNewPass
} = require('../app/Controllers/AuthController')

router.post('/register', JWTregister)
router.post('/login', JWTlogin)
router.get('/verify/:id/:token', JWTverify)
router.post('/forgot-pass', JWTforgotPassword)
router.get('/reset-pass/:userId/:resetToken', ResetPassword)
router.post('/set-new-pass', SetNewPass)


module.exports = router
