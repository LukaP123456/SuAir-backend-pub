const express = require('express')
const router = express.Router()
const {addEmail, getEmails, updateEmail, deleteEmail} = require('../app/Controllers/NewsLetterController')

router.post('/add-email', addEmail)
router.get('/get-emails', getEmails)
router.put('/put-email/:id', updateEmail)
router.delete('/del-email/:id', deleteEmail)

module.exports = router
