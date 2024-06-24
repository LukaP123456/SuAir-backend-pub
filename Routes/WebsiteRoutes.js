const express = require('express')
const router = express.Router()
const {addWebsite, getWebsites, deleteWebsites} = require('../app/Controllers/WebsiteController')

router.put('/add', addWebsite)
router.get('/get', getWebsites)
router.delete('/del', deleteWebsites)

module.exports = router
