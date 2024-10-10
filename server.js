/*********************************************************************************
WEB322 – Assignment 02
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
const storeService = require('./store-service');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect('/about');
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then((items) => {
            res.json(items);
        })
        .catch((err) => {
            res.status(500).json({ message: err });
        });
});

app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then((publishedItems) => {
            res.json(publishedItems);
        })
        .catch((err) => {
            res.status(500).json({ message: err });
        });
});

app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((categories) => {
            res.json(categories);
        })
        .catch((err) => {
            res.status(500).json({ message: err });
        });
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
