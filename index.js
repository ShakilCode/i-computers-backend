// Import the express.js framework
import express from 'express'
// Import the mongoose to connect backend to the MongoDB
import mongoose from 'mongoose'
import userRouter from './router/userRouter.js'
import productRouter from './router/productRouter.js'
import authorizeUser from './lib/jwtMiddleware.js'



// MongoDB URI
const mongoURI = "mongodb+srv://admin:1234@cluster0.aaztane.mongodb.net/?appName=Cluster0"

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

// Body Parser to make HHTP req to proper req and send to the proper request without messed
app.use(express.json())

// middleware for check jwt token
app.use(authorizeUser)

// Connect the user router
app.use("/users", userRouter)

// Connect the product router
app.use("/products", productRouter)

// Start the server and make it listed for incoming requests on a specified port
app.listen(3000,
    // Arrow function
    ()=>{
        console.log("Server is running on port 3000")
    }
)


