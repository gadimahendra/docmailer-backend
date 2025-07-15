const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' })

require('dotenv').config();

app.post('/send-email', upload.array('docs'), async (req, res) => {

    const userEmail = req.body.email
    const name = req.body.name
    const phone = req.body.phone
    const files = req.files
    const address = req.body.address
    const position = req.body.position
    const employement_type = req.body.employment_type


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userEmail || !emailRegex.test(userEmail)) {
        return res.status(400).json({ error: 'Invalid or missing email address' });
    }

    if (!name || !phone || !position) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Please upload at least one document' });
    }

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }

    })

    const attachments = files.map(file => ({
        filename: file.originalname,
        path: file.path,
    }));

    const mailToCompany = {
        from: `"${name}" <${userEmail}>`,
        to: process.env.EMAIL_USER,
        subject: `New Application for ${position}`,
        text: `
                New Job Application Received
                Name: ${name}
                Email: ${userEmail}
                Phone: ${phone}
                Address: ${address}
                Position Applied: ${position}
                Employment Type: ${employement_type}
                See attached documents.`,
        attachments: attachments,
    };

    const mailToUser = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Thanks for applying at AnantWave!',
        text: `Hi ${name},
               Thank you for applying to our job post. We have received your application and will review it shortly.
                - Anantwave HR Team`,
    };

    try {
        await transporter.sendMail(mailToCompany);
        await transporter.sendMail(mailToUser);
        return res.status(200).json({ message: 'Application submitted and confirmation sent to user' })
    } catch (err) {
        console.error(err);
        return res.status(500).send('Email failed to send');
    } finally {
        files.forEach(file => {
            fs.unlink(file.path, (err) => {
                if (err) console.error(`⚠️ Failed to delete ${file.path}`);
            });
        });
    }
})


app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});