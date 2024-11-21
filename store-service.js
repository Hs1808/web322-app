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
            resolve(categories);
        } else {
            reject("No categories found");
        }
    });
}

function addItem(itemData) {
    return new Promise((resolve) => {
        
        itemData.id = items.length + 1;

        
        itemData.published = itemData.published === 'on';

        
        itemData.postDate = new Date().toISOString().split('T')[0]; 

        
        items.push(itemData);

        
        resolve(itemData);
    });
}


function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const itemsByCategory = items.filter(item => item.category === parseInt(category));
        itemsByCategory.length ? resolve(itemsByCategory) : reject("no results returned");
    });
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const minDate = new Date(minDateStr);
        const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
        filteredItems.length ? resolve(filteredItems) : reject("no results returned");
    });
}

 function getItemById(id) {
    return new Promise((resolve, reject) => {
        const item = items.find((item) => item.id.toString() === id);
        if (item) {
          resolve(item);
        } else {
          reject('Item not found');
        }
      });
}


function getPublishedItemsByCategory(category) {
    return new Promise((resolve, reject) => {
      
      const filteredItems = items.filter(
        (item) => item.published && item.category == category
      );
      if (filteredItems.length > 0) {
        resolve(filteredItems);
      } else {
        reject("No published items found in this category");
      }
    });
  }
  
 

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories,
    addItem,
    getItemsByCategory,
    getItemsByMinDate,
    getPublishedItemsByCategory,
    getItemById
};
