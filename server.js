/*********************************************************************************
WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Harshdeep Singh
Student ID: 171289218
Date: October 9th, 2024
Glitch Web App URL: https://web322-app-harshdeep-singh.glitch.me
GitHub Repository URL: https://github.com/Hs1808/web322-app
********************************************************************************/

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const storeService = require("./store-service");
const exphbs = require("express-handlebars");


dotenv.config();


const app = express();


app.engine(
    ".hbs",
    exphbs.engine({
      extname: ".hbs",
      helpers: {
        navLink: function (url, options) {
          return url === this.activeRoute ? "active" : "";
        },
        equal: function (lvalue, rvalue, options) {
          if (lvalue !== rvalue) {
            return options.inverse(this);
          } else {
            return options.fn(this);
          }
        },
        
        ifEquals: function (a, b, options) {
          if (a == b) {
            return options.fn(this); 
          } else {
            return options.inverse(this); 
          }
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


app.use(express.static("public"));


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


const PORT = process.env.PORT || 8080;



app.get("/", (req, res) => {
  res.redirect("/shop");
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About Us" });
});

app.get("/items/add", (req, res) => {
  res.render("addItem", { title: "Add Item" });
});

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
app.get("/categories", (req, res) => {
    storeService
      .getCategories()
      .then((categories) => res.render("categories", { categories, title: "Categories" }))
      .catch((err) => res.render("categories", { message: "No categories found" }));
  });
  
  app.get("/shop", (req, res) => {
    const { category } = req.query;
    let post = null;
    let posts = [];
    let categories = [];
    let message = "";
  
   
    storeService.getCategories()
      .then((allCategories) => {
        categories = allCategories;
  
       
        if (category) {
          storeService
            .getPublishedItemsByCategory(category)
            .then((filteredItems) => {
              posts = filteredItems;
              post = posts[0]; 
              res.render("shop", {
                post,
                items: posts,
                categories,
                viewingCategory: category,
                title: "Shop",
                message,
              });
            })
            .catch((err) => {
              message = err;
              res.render("shop", {
                message,
                categories,
                title: "Shop",
              });
            });
        } else {
        
          storeService
            .getPublishedItems()
            .then((allItems) => {
              posts = allItems;
              post = posts[0]; 
              res.render("shop", {
                post,
                items: posts,
                categories,
                viewingCategory: category,
                title: "Shop",
                message,
              });
            })
            .catch((err) => {
              message = err;
              res.render("shop", {
                message,
                categories,
                title: "Shop",
              });
            });
        }
      })
      .catch((err) => {
        message = "Unable to retrieve categories";
        res.render("shop", { message, title: "Shop" });
      });
  });
  

  app.get('/shop/:id', (req, res) => {
    const itemId = req.params.id;
  
    storeService.getItemById(itemId)
      .then((item) => {
        
        res.render('shop', { items: [item], title: `Shop - Item ${itemId}`, currentPath: req.path });
      })
      .catch((err) => {
        res.status(404).render('404', { message: err, title: 'Item Not Found', currentPath: req.path });
      });
  });

app.get("/items", (req, res) => {
  const { category, minDate } = req.query;
  if (category) {
    storeService
      .getItemsByCategory(category)
      .then((items) => res.render("items", { items, title: "Items" }))
      .catch((err) => res.render("items", { message: "No items found" }));
  } else if (minDate) {
    storeService
      .getItemsByMinDate(minDate)
      .then((items) => res.render("items", { items, title: "Items" }))
      .catch((err) => res.render("items", { message: "No items found" }));
  } else {
    storeService
      .getAllItems()
      .then((items) => res.render("items", { items, title: "Items" }))
      .catch((err) => res.render("items", { message: "No items found" }));
  }
});

app.get('/items/:id', (req, res) => {
  const itemId = req.params.id;

  storeService.getItemById(itemId)
    .then((item) => {
      
      res.render('items', { items: [item], title: `Item ${itemId}`, currentPath: req.path });
    })
    .catch((err) => {
      res.status(404).render('404', { message: err, title: 'Item Not Found', currentPath: req.path });
    });
});



app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});


storeService
  .initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express http server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Unable to start the server: ${err}`);
  });
