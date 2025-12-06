import User from "../models/user.js";
// bcrypt for hashing
import bcrypt from 'bcrypt'
// JWT
import jwt from 'jsonwebtoken'

export function createUser(req, res) {

    // Hashing                                         10 salting rounds
    const hashedPassword = bcrypt.hashSync(req.body.password,10)

    const user = new User(
        {
            email : req.body.email,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            // use the hashing name
            password : hashedPassword,
        }
    )

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



export function loginUser(req, res){
    
    User.findOne(
        {
            email : req.body.email
        }
    ).then(
        (user)=>{
            console.log(user)

            if(user == null){
                res.json({
                    message : "User with given email not found"
                })
            } else{

                const isPasswordValid = bcrypt.compareSync(req.body.password, user.password)

                if(isPasswordValid){

                    // create a jwt 
                    const token = jwt.sign({
                        email : user.email,
                        firstName : user.firstName,
                        lastName : user.lastName,
                        role : user.role,
                        image: user.image,
                        isEmailVerified : user.isEmailVerified,
                    }, "i-computers54!")

                    res.json({
                        message : "Login successful",
                        token: token
                    })
                }else{
                    res.status(401).json({
                        message : "Invalid password"
                    })
                }
            }
        }
    ).catch(
        ()=>{
            res.status(500).json({
            message : "Internal server error"
            })
        }
    )
}

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