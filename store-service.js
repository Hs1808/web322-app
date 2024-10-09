
const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];


function initialize() {
    return new Promise((resolve, reject) => {
        
        fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8', (err, data) => {
            if (err) {
                reject("Unable to read items.json file");
                return;
            }
            items = JSON.parse(data);

            
            fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8', (err, data) => {
                if (err) {
                    reject("Unable to read categories.json file");
                    return;
                }
                categories = JSON.parse(data);
                resolve();  
            });
        });
    });
}


function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) {
            resolve(items);  
        } else {
            reject("No items available");
        }
    });
}


function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length > 0) {
            resolve(publishedItems);  
        } else {
            reject("No published items found");
        }
    });
}


function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);  // Resolve with all categories
        } else {
            reject("No categories found");
        }
    });
}


module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories
};
