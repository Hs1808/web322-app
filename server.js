/*********************************************************************************
WEB322 – Assignment 05
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Harshdeep Singh
Student ID: 171289218
Date: October 9th, 2024
Glitch Web App URL: https://web322-app-harshdeep-singh.glitch.me
GitHub Repository URL: https://github.com/Hs1808/web322-app
********************************************************************************/

const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const storeService = require("./store-service");
const exphbs = require("express-handlebars");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Setup Handlebars
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return url === this.activeRoute ? "active" : "";
      },
      equal: function (lvalue, rvalue, options) {
        return lvalue === rvalue ? options.fn(this) : options.inverse(this);
      },
      ifEquals: function (a, b, options) {
        return a == b ? options.fn(this) : options.inverse(this);
      },
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      },
    },
  })
);
app.set("view engine", ".hbs");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const upload = multer();

// Static middleware
app.use(express.static("public"));

// Middleware to track active route
app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Middleware to handle URL-encoded bodies (for forms like adding a category)
app.use(express.urlencoded({ extended: true }));

// Redirect root to /shop
app.get("/", (req, res) => {
  res.redirect("/shop");
});

// About route
app.get("/about", (req, res) => {
  res.render("about", { title: "About Us" });
});

// Shop routes
app.get("/shop", (req, res) => {
  const { category } = req.query;

  let categories = [];
  let items = [];
  let selectedItem = null;

  storeService
    .getCategories()
    .then((cats) => {
      categories = cats;
      return category
        ? storeService.getPublishedItemsByCategory(category)
        : storeService.getPublishedItems();
    })
    .then((publishedItems) => {
      items = publishedItems;
      selectedItem = items.length > 0 ? items[0] : null;
      res.render("shop", {
        categories,
        items,
        selectedItem,
        viewingCategory: category,
        title: "Shop",
        message: items.length === 0 ? "No items available." : null,
      });
    })
    .catch((err) => {
      res.render("shop", {
        categories,
        message: "Unable to retrieve shop data.",
        title: "Shop",
      });
    });
});

app.get("/shop/:id", (req, res) => {
  const itemId = req.params.id;

  let categories = [];
  let selectedItem = null;

  storeService
    .getCategories()
    .then((cats) => {
      categories = cats;
      return storeService.getItemById(itemId);
    })
    .then((item) => {
      selectedItem = item;
      res.render("shop", {
        categories,
        selectedItem,
        items: [item],
        title: `Shop - Item ${itemId}`,
      });
    })
    .catch((err) => {
      res.status(404).render("404", { title: "Item Not Found", message: err });
    });
});

// Items routes
app.get("/items", (req, res) => {
  const { category, minDate } = req.query;

  let promise;

  if (category) {
    promise = storeService.getItemsByCategory(category);
  } else if (minDate) {
    promise = storeService.getItemsByMinDate(minDate);
  } else {
    promise = storeService.getAllItems();
  }

  promise
    .then((items) => {
      if (items.length > 0) {
        res.render("items", { items, title: "Items" });
      } else {
        res.render("items", { message: "No items found", title: "Items" });
      }
    })
    .catch(() => {
      res.render("items", { message: "No items found", title: "Items" });
    });
});

// Categories route
app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((categories) => {
      if (categories.length > 0) {
        res.render("categories", { categories, title: "Categories" });
      } else {
        res.render("categories", { message: "No categories found", title: "Categories" });
      }
    })
    .catch(() => {
      res.render("categories", { message: "No categories found", title: "Categories" });
    });
});

// Add Category route (GET)
app.get("/categories/add", (req, res) => {
  res.render("addCategory", { title: "Add Category" });
});

// Add Category route (POST)
app.post("/categories/add", (req, res) => {
  storeService
    .addCategory(req.body)
    .then(() => res.redirect("/categories"))
    .catch((err) => res.status(500).send("Unable to add category: " + err));
});

// Delete Category route
app.get("/categories/delete/:id", (req, res) => {
  const categoryId = req.params.id;

  storeService
    .deleteCategoryById(categoryId)
    .then(() => res.redirect("/categories"))
    .catch((err) => res.status(500).send("Unable to remove category: " + err));
});
// Add Item Route - POST
app.post("/items/add", upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
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
    storeService
      .addItem(req.body)
      .then(() => res.redirect("/items"))
      .catch((err) => res.status(500).json({ message: err }));
  }
});

// Add Item Route - GET
app.get("/items/add", (req, res) => {
  storeService
      .getCategories()
      .then((categories) => {
          // Render the addItem view with categories if they exist
          res.render("addItem", { categories: categories, title: "Add Item" });
      })
      .catch((err) => {
          // If categories could not be fetched, render with empty categories
          res.render("addItem", { categories: [], title: "Add Item" });
      });
});


// Delete Item route
app.get("/items/delete/:id", (req, res) => {
  const itemId = req.params.id;

  storeService
    .deletePostById(itemId)
    .then(() => res.redirect("/items"))
    .catch((err) => res.status(500).send("Unable to remove item: " + err));
});

// 404 Page
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// Start server
storeService
  .initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Unable to start server: ${err}`);
  });
