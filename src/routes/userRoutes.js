const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/forgotPassword', userController.forgotPassword);

module.exports = router;