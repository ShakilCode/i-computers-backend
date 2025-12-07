// import the mongoose
import mongoose from "mongoose";

// Creating a User Schema
// A "schema" is like a blueprint for how user data will look inside MongoDB.
// It tells MongoDB what fields each user document should have and what rules to follow.
const userSchema = new mongoose.Schema({

    // User's email address
    // must be a string
    // can't be empty
    // no two users can have the same email
    email : {
        type : String,
        required : true,
        unique : true
    },

    // User's first name
    firstName : {
        type : String,
        required : true
    },

    // User's last name
    lastName : {
        type : String,
        required : true
    },

    // User's password (hashed before saving)
    password : {
        type : String,
        required : true
    },

    // User role — helps you decide if the user is admin or customer
    // only these two values allowed ["admin", "customer"], // if not given, use "customer"
    role : {
        type : String,
        required : true,
        enum : ["admin", "customer"],
        default : "customer"
    },

    // To check whether the user is blocked or allowed to use the app
    // by default user is not blocked
    isBlocked : {
        type : Boolean,
        default : false,
        required : true
    },

    // To check if the user has verified their email
    // false until they verify
    isEmailVerified : {
        type : Boolean,
        default : false,
        required : true
    },

    // Profile image URL of the user
    image : {
        type : String,
        // Default profile picture if user doesn’t upload one
        default : "/images/default-profile.png",
        required : true
    }

})

// Creating a model from the schema
// "User" will be the collection name in MongoDB (automatically pluralized to "users")
const User = mongoose.model("User", userSchema)

// Exporting the model so we can use it in other files
export default User;