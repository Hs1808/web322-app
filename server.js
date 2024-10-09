
const express = require('express');
const storeService = require('./store-service');
const app = express();
const PORT = process.env.PORT || 8080;


storeService.initialize()
    .then(() => {
        console.log("Data successfully initialized");
    })
    .catch((err) => {
        console.error(`Initialization failed: ${err}`);
    });


app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then((items) => {
            res.json(items);
        })
        .catch((err) => {
            res.status(500).json({ error: err });
        });
});


app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then((publishedItems) => {
            res.json(publishedItems);
        })
        .catch((err) => {
            res.status(500).json({ error: err });
        });
});


app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((categories) => {
            res.json(categories);
        })
        .catch((err) => {
            res.status(500).json({ error: err });
        });
});


initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`Express http server listening on port ${PORT}`);
    });
}).catch(err => {
    console.error(err);
});
