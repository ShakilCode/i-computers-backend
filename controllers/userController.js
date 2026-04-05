import User from "../models/user.js";
// bcrypt is used for hashing passwords securely
import bcrypt from 'bcrypt'
// JWT (JSON Web Token) is used for login authentication
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import OTP from "../models/otp.js";
import nodemailer from "nodemailer";
import axios from "axios";

dotenv.config()

const transporter = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: "shakilahamadqa@gmail.com",
		pass: process.env.GMAIL_APP_PASSWORD,
	},
});

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
                    }, 
					process.env.JWT_SECRET,
					{ expiresIn: req.body.rememberme ? "30d" : "48h" },
				)

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


export function getUser(req,res){

	if(req.user == null){
		res.status(401).json({
			message: "Unauthorized"
		})
		return
	}

	res.json({
		email: req.user.email,
		firstName: req.user.firstName,
		lastName: req.user.lastName,
		role: req.user.role,
		image: req.user.image,
		isEmailVerified: req.user.isEmailVerified,
	})


}

export async function updateUserProfile(req,res){

	if(req.user == null){
		res.status(401).json({
			message: "Unauthorized"
		})
		return
	}
	try{
		await User.updateOne({ email : req.user.email }, { firstName : req.body.firstName, lastName : req.body.lastName, image : req.body.image })
		const user = await User.findOne({ email : req.user.email })
		const token = jwt.sign(
						{
							email: user.email,
							firstName: user.firstName,
							lastName: user.lastName,
							role: user.role,
							image: user.image,
							isEmailVerified: user.isEmailVerified,
						},
						process.env.JWT_SECRET,
						{ expiresIn: req.body.rememberme ? "30d" : "48h" }
					);
		res.json({ message : "Profile updated successfully", token : token })
	}catch(error){
		res.status(500).json({ message : "Error updating profile", error : error })
	}
}

export async function changeUserPassword(req,res){

	if(req.user == null){
		res.status(401).json({
			message: "Unauthorized"
		})
		return
	}

	try{

		const hashedPassword = bcrypt.hashSync(req.body.password, 10);

		await User.updateOne({ email : req.user.email }, { password : hashedPassword })
		res.json({ message : "Password changed successfully" })

	}catch(error){
		res.status(500).json({ message : "Error changing password", error : error })
	}
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

// send the OTP
export async function sendOTP(req, res) {
	try {
		const user = await User.findOne({ email: req.body.email });

		if (user == null) {
			res.status(404).json({ message: "User with given email not found" });
			return;
		}

		// Generate and send OTP logic here
		//otp between 10000 and 99999
		const otp = Math.floor(10000 + Math.random() * 90000);

        // if there is any otp before send a new one delete the previous otp
		await OTP.deleteMany({ email: req.body.email });

		const newOTP = new OTP({
			email: req.body.email,
			otp: otp,
		});

		await newOTP.save();

		const message = {
			from: "shakilahamadqa@gmail.com",
			to: req.body.email,
			subject: "Your OTP for password reset",
			text:
				"Your OTP for password reset is " +
				otp +
				". It is valid for 10 minutes.",
		};

		transporter.sendMail(message, (error, info) => {
			if (error) {
				console.log("Error sending email", error);
				res.status(500).json({ message: "Error sending OTP", error: error });
			} else {
				console.log("Email sent successfully", info.response);
				res.json({ message: "OTP sent successfully" });
			}
		});
	} catch (error) {
		res.status(500).json({ message: "Error sending OTP", error: error });
	}
}

// verify the otp and reset the password
export async function verifyOTP(req, res) {
	try {
		const otpCode = req.body.otp;
		const email = req.body.email;
		const newPassword = req.body.newPassword;

		const otpRecord = await OTP.findOne({ email: email });

		if (otpRecord == null) {
			res.status(404).json({ message: "OTP not found for the given email" });
			return;
		}

		if (otpRecord.otp != otpCode) {
			res.status(400).json({ message: "Invalid OTP" });
			return;
		}

		const hashedPassword = bcrypt.hashSync(newPassword, 10);

		await User.updateOne({ email: email }, { password: hashedPassword });

		await OTP.deleteOne({ email: email });

		res.json({ message: "Password reset successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error verifying OTP", error: error });
	}
}

// google login
export async function googleLogin(req, res) {
	try {
		//
		const googleResponse = await axios.get(
			"https://www.googleapis.com/oauth2/v3/userinfo",
			{
				headers: {
					Authorization: "Bearer " + req.body.token,
				},
			},
		);

		const user = await User.findOne({ email: googleResponse.data.email });

		console.log(user);

		if (user == null) {
			const newUser = new User({
				email: googleResponse.data.email,
				firstName: googleResponse.data.given_name,
				lastName: googleResponse.data.family_name,
				password: "google-login",
				image: googleResponse.data.picture,
				isEmailVerified: true,
			});

			await newUser.save();

			const token = jwt.sign(
				{
					email: newUser.email,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					role: newUser.role,
					image: newUser.image,
					isEmailVerified: newUser.isEmailVerified,
				},
				process.env.JWT_SECRET,
			);

			res.json({
				message: "Login successfull",
				token: token,
				role: newUser.role,
			});
		} else {
			if (user.isBlocked) {
				res
					.status(403)
					.json({
						message:
							"Your account is blocked. Please contact support for more information.",
					});
				return;
			}
			const token = jwt.sign(
				{
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					image: user.image,
					isEmailVerified: user.isEmailVerified,
				},
				process.env.JWT_SECRET,
			);

			res.json({
				message: "Login successfull",
				token: token,
				role: user.role,
			});
		}
	} catch (error) {
		console.log("Error logging in with Google", error);
		res
			.status(500)
			.json({ message: "Error logging in with Google", error: error });
	}
}