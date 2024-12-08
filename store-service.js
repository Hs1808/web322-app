const { Sequelize, DataTypes } = require("sequelize");

// Set up Sequelize instance with Postgres credentials
const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'vWeLmI9Th2Qk', {
    host: 'ep-dawn-glitter-a5vro309.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

// Define the Category model
const Category = sequelize.define("Category", {
    category: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Define the Item model
const Item = sequelize.define("Item", {
    body: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    postDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    featureImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    published: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull: false
    }
});

// Define relationship: An Item belongs to a specific Category
Item.belongsTo(Category, { foreignKey: "category" });

// Initialize database
function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve("Database synced successfully!"))
            .catch((err) => reject("Unable to sync the database: " + err));
    });
}

// Fetch all items
function getAllItems() {
    return Item.findAll()
        .then((data) => data)
        .catch(() => Promise.reject("No results returned"));
}

// Fetch items by category
function getItemsByCategory(category) {
    return Item.findAll({ where: { category } })
        .then((data) => data)
        .catch(() => Promise.reject("No results returned"));
}

// Fetch items by minimum date
function getItemsByMinDate(minDateStr) {
    const { gte } = Sequelize.Op;
    return Item.findAll({
        where: {
            postDate: {
                [gte]: new Date(minDateStr)
            }
        }
    })
        .then((data) => data)
        .catch(() => Promise.reject("No results returned"));
}

// Fetch an item by ID
function getItemById(id) {
    return Item.findByPk(id)
        .then((data) => data)
        .catch(() => Promise.reject("Item not found"));
}

// Add a new item
function addItem(itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published === "on";
        // Replace empty values with null
        for (let key in itemData) {
            if (itemData[key] === "") itemData[key] = null;
        }

        itemData.postDate = new Date();

        Item.create(itemData)
            .then((data) => resolve(data))
            .catch(() => reject("Unable to create item"));
    });
}

// Fetch all published items
function getPublishedItems() {
    return Item.findAll({ where: { published: true } })
        .then((data) => data)
        .catch(() => Promise.reject("No published items found"));
}

// Fetch published items by category
function getPublishedItemsByCategory(category) {
    return Item.findAll({ where: { published: true, category } })
        .then((data) => data)
        .catch(() => Promise.reject("No published items found in this category"));
}

// Fetch all categories
function getCategories() {
    return Category.findAll()
        .then((data) => data)
        .catch(() => Promise.reject("No categories found"));
}

// Add a new category
function addCategory(categoryData) {
    return new Promise((resolve, reject) => {
        for (let key in categoryData) {
            if (categoryData[key] === "") categoryData[key] = null;
        }

        Category.create(categoryData)
            .then((data) => resolve(data))
            .catch(() => reject("Unable to create category"));
    });
}

// Delete category by ID
function deleteCategoryById(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({ where: { id } })
            .then((result) => {
                if (result) {
                    resolve("Category deleted successfully");
                } else {
                    reject("Category not found");
                }
            })
            .catch(() => reject("Unable to remove category"));
    });
}

// Delete item by ID
function deletePostById(id) {
    return new Promise((resolve, reject) => {
      Item.destroy({ where: { id: id } })
        .then((result) => {
          if (result === 0) {
            reject("Item not found"); 
          } else {
            resolve("Item deleted successfully");
          }
        })
        .catch((err) => reject("Unable to delete item: " + err));
    });
  }
  

module.exports = {
    initialize,
    getAllItems,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById,
    addItem,
    getPublishedItems,
    getPublishedItemsByCategory,
    getCategories,
    addCategory,
    deleteCategoryById,
    deletePostById,
    Item,
    Category
};
