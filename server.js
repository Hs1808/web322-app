/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Harshdeep Singh
Student ID: 171289218
Date: October 9th, 2024
Glitch Web App URL: https://web322-app-harshdeep-singh.glitch.me
GitHub Repository URL: https://github.com/Hs1808/web322-app
********************************************************************************/

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require('./store-service');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true
});

const upload = multer();

app.use(express.static('public'));

// Routes

app.get('/', (req, res) => {
    res.redirect('/about');
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'addItem.html'));
});

app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body)
            .then(() => res.redirect("/items"))
            .catch((err) => res.status(500).json({ message: err }));
    }
});

app.get('/items', (req, res) => {
    const { category, minDate } = req.query;
    if (category) {
        storeService.getItemsByCategory(category)
            .then((items) => res.json(items))
            .catch((err) => res.status(500).json({ message: err }));
    } else if (minDate) {
        storeService.getItemsByMinDate(minDate)
            .then((items) => res.json(items))
            .catch((err) => res.status(500).json({ message: err }));
    } else {
        storeService.getAllItems()
            .then((items) => res.json(items))
            .catch((err) => res.status(500).json({ message: err }));
    }
});

app.get('/item/:id', (req, res) => {
    storeService.getItemById(req.params.id)
        .then((item) => res.json(item))
        .catch((err) => res.status(500).json({ message: err }));
});

app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Unable to start the server: ${err}`);
    });