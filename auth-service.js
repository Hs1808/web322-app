const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Include bcryptjs for password hashing
let Schema = mongoose.Schema;

// Define the user schema
const userSchema = new Schema({
  userName: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  loginHistory: [
    {
      dateTime: { type: Date, required: true },
      userAgent: { type: String, required: true },
    },
  ],
});

let User; // To be defined on new connection

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    const db = mongoose.createConnection(
      "mongodb+srv://hsingh866:9QiW3DC1RgxZNqS6@seneca.s6xzg.mongodb.net/?retryWrites=true&w=majority&appName=seneca"
    );
    db.on("error", (err) => reject(err));
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    // Hash the password using bcrypt
    bcrypt
      .hash(userData.password, 10)
      .then((hash) => {
        let newUser = new User({
          userName: userData.userName,
          password: hash, // Store hashed password
          email: userData.email,
          loginHistory: [],
        });

        newUser
          .save()
          .then(() => resolve())
          .catch((err) => {
            if (err.code === 11000) reject("User Name already taken");
            else reject("There was an error creating the user: " + err);
          });
      })
      .catch(() => reject("There was an error encrypting the password"));
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) {
          reject("Unable to find user: " + userData.userName);
        } else {
          // Compare the hashed password with the provided password
          bcrypt
            .compare(userData.password, user.password)
            .then((isMatch) => {
              if (!isMatch) {
                reject("Incorrect Password for user: " + userData.userName);
              } else {
                // Log the login history
                user.loginHistory.push({
                  dateTime: new Date(),
                  userAgent: userData.userAgent,
                });

                // Update the user's login history
                User.updateOne(
                  { userName: user.userName },
                  { $set: { loginHistory: user.loginHistory } }
                )
                  .then(() => resolve(user))
                  .catch((err) =>
                    reject("There was an error verifying the user: " + err)
                  );
              }
            })
            .catch((err) =>
              reject("There was an error verifying the user: " + err)
            );
        }
      })
      .catch(() => reject("Unable to find user: " + userData.userName));
  });
};
