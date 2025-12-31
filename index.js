// Import the express.js framework
import express from 'express'
// Import the mongoose to connect backend to the MongoDB
import mongoose from 'mongoose'
import userRouter from './router/userRouter.js'
import productRouter from './router/productRouter.js'
import authorizeUser from './lib/jwtMiddleware.js'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()


// MongoDB URI
const mongoURI = process.env.MONGO_URI

// connect out backend with the database
mongoose.connect(mongoURI).then(
    ()=>{
        console.log("Connected to MongoDB")
    }
).catch(
    ()=>{
        console.log("Error connecting to MongoDB")
    }
)

// Assign the express backend to a variable 
const app = express()

// cors middleware
app.use(cors())

// Body Parser to make HHTP req to proper req and send to the proper request without messed
app.use(express.json())

// middleware for check jwt token
app.use(authorizeUser)

// Connect the user router
app.use("/api/users", userRouter)

// Connect the product router
app.use("/api/products", productRouter)

// Start the server and make it listed for incoming requests on a specified port
app.listen(3000,
    // Arrow function
    ()=>{
        console.log("Server is running on port 3000")
    }
)