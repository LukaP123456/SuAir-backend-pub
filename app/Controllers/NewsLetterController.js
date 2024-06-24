const NewsletterModel = require("../Models/NewsLetter");
const addEmail = async (req, res) => {
    try {
        let email = req.body.email
        const newNewsLetterSchema = new NewsletterModel({
            email: email
        })
        console.log(newNewsLetterSchema)
        const result = await newNewsLetterSchema.save()
        if (result) {
            res.send(result)
        }
    } catch (error) {
        console.log(error);
    }
}

// Get method
const getEmails = async (req, res) => {
    try {
        const emails = await NewsletterModel.find();
        if (emails) {
            res.send(emails);
        } else {
            res.status(404).send('No emails found');
        }
    } catch (error) {
        console.log(error);
    }
}

// Update method
const updateEmail = async (req, res) => {
    try {
        const email = await NewsletterModel.findOneAndUpdate(
            {_id: req.params.id},
            {email: req.body.email},
            {new: true}
        );
        if (email) {
            res.send(email);
        } else {
            res.status(404).send('Email not found');
        }
    } catch (error) {
        console.log(error);
    }
}

// Delete method
const deleteEmail = async (req, res) => {
    try {
        const email = await NewsletterModel.findByIdAndDelete(req.params.id);
        if (email) {
            res.send(email);
        } else {
            res.status(404).send('Email not found');
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    addEmail,
    getEmails,
    updateEmail,
    deleteEmail
}
