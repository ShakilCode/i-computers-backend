import User from "../models/user.js";
// bcrypt is used for hashing passwords securely
import bcrypt from 'bcrypt'
// JWT (JSON Web Token) is used for login authentication
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

// Create User (Register)
export function createUser(req, res) {

    // Hash the user's password before saving it
    // 10 = number of salt rounds (recommended for security)
    const hashedPassword = bcrypt.hashSync(req.body.password,10)

    // Creating a new User object using data sent from frontend
    const user = new User(
        {
            email : req.body.email,
            firstName : req.body.firstName,
            lastName : req.body.lastName,

            // Save hashed password instead of plain text
            password : hashedPassword,
        }
    )

    // Save user to the database
    user.save().then(

        ()=>{
            res.json({
                message : "User created successfully"
            })
        }

    ).catch(

        (error)=>{
            res.json({
                message : "User creation failed", error: error })
        }

    )

}


// Login User
export function loginUser(req, res){
    
    // Check if a user exists with the given email
    User.findOne(
        {
            email : req.body.email
        }
    ).then(
        (user)=>{

            // If no user found, return error
            if(user == null){
                res.status(404).json({
                    message : "User with given email not found"
                })
            } else{

                // Compare entered password with stored hashed password
                const isPasswordValid = bcrypt.compareSync(req.body.password, user.password)

                if(isPasswordValid){

                    // Create a JWT token for the logged-in user
                    // This token stores user's information
                    // NEVER store password inside a token
                    const token = jwt.sign({
                        email : user.email,
                        firstName : user.firstName,
                        lastName : user.lastName,
                        role : user.role,
                        image: user.image,
                        isEmailVerified : user.isEmailVerified,
                        // Replace this with environment variable later
                    }, process.env.JWT_SECRET)

                    // Send success + token to frontend
                    res.json({
                        message : "Login successful",
                        token: token,
                        role: user.role
                    })
                }else{
                    // Password incorrect
                    res.status(401).json({
                        message : "Invalid password"
                    })
                }
            }
        }
    ).catch(
        ()=>{
            // Something went wrong in server/database
            res.status(500).json({
            message : "Internal server error"
            })
        }
    )
}


// Check if Logged-in User is Admin
export function isAdmin(req){

    // check in the request there is a user or not
    if(req.user == null){
        // if there is no user means there is no admin so its false
        return false
    }

    // check the user is admin or not
    if(req.user.role == "admin"){
        // if the role is admin then it is true
        return true
    }else{
        return false
    }
}