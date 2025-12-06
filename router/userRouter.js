import express from 'express'
import { createUser, loginUser } from '../controllers/userController.js'

const userRouter = express.Router()

// localhost:3000/users
userRouter.post("/", createUser)

//localhost:3000/users/login
userRouter.post("/login", loginUser)

export default userRouter