import express from 'express'
import { blockOrUnblockUser, changeRole, changeUserPassword, createUser, getAllUsers, getUser, googleLogin, loginUser, sendOTP, updateUserProfile, verifyOTP } from '../controllers/userController.js'

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
userRouter.post("/update-password", changeUserPassword)
userRouter.post("/send-otp",sendOTP)
userRouter.post("/verify-otp",verifyOTP)
userRouter.post("/google-login", googleLogin)
userRouter.post("/toggle-block", blockOrUnblockUser)
userRouter.post("/toggle-role", changeRole)
userRouter.put("/", updateUserProfile)
userRouter.get("/profile",getUser)
userRouter.get("/all/:pageSize/:pageNumber", getAllUsers)

// Export router so index.js can use it
export default userRouter