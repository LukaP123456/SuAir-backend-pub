const User = require("../Models/User");
const addWebsite = async (req, res) => {
    try {
        const websites = req.body.websites
        const token = req.headers['authorization'];
        const payload = token.split('.')[1];
        const decoded_payload = Buffer.from(payload, 'base64').toString();
        const user_data = JSON.parse(decoded_payload);
        const user_id = user_data.id;
        const user = await User.findOneAndUpdate(
            {_id: user_id},
            {websites: websites},
            {new: true}
        );
        if (user) {
            res.send(user);
        } else {
            res.status(404).send('Email not found');
        }
    } catch (error) {
        console.log(error);
    }
}

// Get all websites for a user model
const getWebsites = async (req, res) => {
    try {
        const token = req.headers['authorization'];
        const payload = token.split('.')[1];
        const decoded_payload = Buffer.from(payload, 'base64').toString();
        const user_data = JSON.parse(decoded_payload);
        const user_id = user_data.id;
        const user = await User.findById(user_id);
        if (user) {
            res.send(user.websites);
        } else {
            res.status(404).send('Email not found');
        }
    } catch (error) {
        console.log(error);
    }
}
// Delete all websites from a user model
const deleteWebsites = async (req, res) => {
    try {
        const token = req.headers['authorization'];
        const payload = token.split('.')[1];
        const decoded_payload = Buffer.from(payload, 'base64').toString();
        const user_data = JSON.parse(decoded_payload);
        const user_id = user_data.id;
        const user = await User.findOneAndUpdate(
            {_id: user_id},
            {websites: []},
            {new: true}
        );
        if (user) {
            res.send(user);
        } else {
            res.status(404).send('Email not found');
        }
    } catch (error) {
        console.log(error);
    }
}

const checkFavoriteSites = async (req, res) => {
    try {
        const siteNames = req.body.websites;
        const userID = req.body.userID;
        console.log(userID)
        const user = await User.findById(userID);
        if (user) {
            let favoriteSites = [];
            let notFavoriteSites = [];
            siteNames.forEach(siteName => {
                if (user.websites.includes(siteName)) {
                    favoriteSites.push(siteName);
                } else {
                    notFavoriteSites.push(siteName);
                }
            });
            res.send({
                favoriteSites: favoriteSites,
                notFavoriteSites: notFavoriteSites
            });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    addWebsite,
    getWebsites,
    deleteWebsites,
    checkFavoriteSites
}
