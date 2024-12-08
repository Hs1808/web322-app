/*********************************************************************************
WEB322 – Assignment 06
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
const clientSessions = require("client-sessions");
const path = require("path");

const storeService = require("./store-service");
const authData = require("./auth-service"); 
const exphbs = require("express-handlebars");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;


app.use(
  clientSessions({
    cookieName: "session",
    secret: "web322_assignment6", 
    duration: 2 * 60 * 60 * 1000, 
    activeDuration: 1000 * 60 * 60, 
  })
);


app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});


function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}


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
app.set("views", path.join(__dirname, "views")); 

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const upload = multer();


app.use(express.static(path.join(__dirname, "public"))); 


app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.redirect("/shop");
});


app.get("/about", (req, res) => {
  res.render("about", { title: "About Us" });
});


app.get("/login", (req, res) => res.render("login", { title: "Login" }));
app.get("/register", (req, res) => res.render("register", { title: "Register" }));

app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => res.render("register", { successMessage: "User created" }))
    .catch((err) =>
      res.render("register", { errorMessage: err, userName: req.body.userName })
    );
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect("/items");
    })
    .catch((err) =>
      res.render("login", { errorMessage: err, userName: req.body.userName })
    );
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", { title: "User History" });
});


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
    .catch((err) =>
      res.render("shop", { categories, message: "Unable to retrieve shop data.", title: "Shop" })
    );
});


app.use("/categories", ensureLogin);
app.use("/items", ensureLogin);


app.get("/items", (req, res) => {
  const { category, minDate } = req.query;
  let promise;

  if (category) promise = storeService.getItemsByCategory(category);
  else if (minDate) promise = storeService.getItemsByMinDate(minDate);
  else promise = storeService.getAllItems();

  promise
    .then((items) =>
      items.length > 0
        ? res.render("items", { items, title: "Items" })
        : res.render("items", { message: "No items found", title: "Items" })
    )
    .catch(() => res.render("items", { message: "No items found", title: "Items" }));
});


app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((categories) =>
      categories.length > 0
        ? res.render("categories", { categories, title: "Categories" })
        : res.render("categories", { message: "No categories found", title: "Categories" })
    )
    .catch(() =>
      res.render("categories", { message: "No categories found", title: "Categories" })
    );
});


app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});


storeService
  .initialize()
  .then(authData.initialize)
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => console.error(`Unable to start server: ${err}`));
