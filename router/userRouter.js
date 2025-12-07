import express from 'express'
import { createUser, loginUser } from '../controllers/userController.js'

// Create a new router object
const userRouter = express.Router()

// Route: Create a user (Register)
// Method: POST
// URL: http://localhost:3000/users
// When a POST request is sent to /users,
// it calls the createUser controller function.
userRouter.post("/", createUser)

// Route: Login user
// Method: POST
// URL: http://localhost:3000/users/login
// When a POST request is sent to /users/login,
// it calls the loginUser controller function.
userRouter.post("/login", loginUser)

// Export router so index.js can use it
export default userRouter