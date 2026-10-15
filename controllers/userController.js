import User from "../models/user.js";
import ContactUs from "../models/contactUs.js";
// bcrypt is used for hashing passwords securely
import bcrypt from 'bcrypt'
// JWT (JSON Web Token) is used for login authentication
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import OTP from "../models/otp.js";
import nodemailer from "nodemailer";
import axios from "axios";
import validator from "validator";

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

// Escape user-provided values before inserting them into HTML email
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[char];
    });
}

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
				if (user.isBlocked) {
					res
						.status(403)
						.json({
							message:
								"Your account is blocked. Please contact support for more information.",
						});
					return;
				}

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

// Contact Us
export async function contactUs(req, res) {
    try {
        const { name, email, subject, message } = req.body;

        // 1. Validate required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof subject !== "string" ||
            typeof message !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !subject.trim() ||
            !message.trim()
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        // 2. Normalize user input
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanSubject = subject.trim();
        const cleanMessage = message.trim();

        // 3. Validate name
        if (cleanName.length < 2 || cleanName.length > 100) {
            return res.status(400).json({
                message: "Name must be between 2 and 100 characters",
            });
        }

        // 4. Validate email
        if (
            !validator.isEmail(cleanEmail, {
                allow_display_name: false,
                require_tld: true,
            })
        ) {
            return res.status(400).json({
                message: "Please enter a valid email address",
            });
        }

        // 5. Detect common email domain typos
        const emailDomain = cleanEmail.split("@")[1];

        const commonDomainCorrections = {
            "gmail.co": "gmail.com",
            "gmail.con": "gmail.com",
            "gmai.com": "gmail.com",
            "gmial.com": "gmail.com",
            "hotmai.com": "hotmail.com",
            "hotmail.co": "hotmail.com",
            "yahoo.co": "yahoo.com",
            "yaho.com": "yahoo.com",
            "outlook.co": "outlook.com",
        };

        if (commonDomainCorrections[emailDomain]) {
            return res.status(400).json({
                message: `Did you mean ${commonDomainCorrections[emailDomain]}? Please check your email address.`,
            });
        }

        // 6. Validate subject
        if (
            cleanSubject.length < 3 ||
            cleanSubject.length > 150
        ) {
            return res.status(400).json({
                message: "Subject must be between 3 and 150 characters",
            });
        }

        // 7. Validate message
        if (
            cleanMessage.length < 10 ||
            cleanMessage.length > 5000
        ) {
            return res.status(400).json({
                message: "Message must be between 10 and 5000 characters",
            });
        }

        // 8. Save enquiry to MongoDB
        const newContact = new ContactUs({
            name: cleanName,
            email: cleanEmail,
            subject: cleanSubject,
            message: cleanMessage,
        });

        await newContact.save();

        // 9. Configure email addresses
        // Use an address you own or are authorized to send from.
        const adminEmail = "shakilahamadqa@gmail.com";
        const senderEmail = "shakilahamadqa@gmail.com";

        // Prevent line breaks in the email subject.
        const emailSubject = cleanSubject
            .replace(/[\r\n]+/g, " ")
            .slice(0, 150);

        // Escape customer input for HTML.
        const safeName = escapeHtml(cleanName);
        const safeEmail = escapeHtml(cleanEmail);
        const safeSubject = escapeHtml(cleanSubject);
        const safeMessage = escapeHtml(cleanMessage);
        const safeCreatedAt = escapeHtml(
            newContact.createdAt.toISOString()
        );
        const safeEnquiryId = escapeHtml(
            newContact._id.toString()
        );

        // 10. Prepare professional email
        const mailOptions = {
            from: {
                name: "I Computers | Customer Enquiries",
                address: senderEmail,
            },

            to: adminEmail,

            // Clicking Reply sends the response to the customer.
            replyTo: {
                name: cleanName,
                address: cleanEmail,
            },

            subject: `New Customer Enquiry | I Computers - ${emailSubject}`,

            // Plain-text version
            text: [
                "I COMPUTERS - CUSTOMER ENQUIRY",
                "================================",
                "",
                "A new enquiry has been submitted through the I Computers website.",
                "",
                `Customer Name: ${cleanName}`,
                `Customer Email: ${cleanEmail}`,
                `Enquiry Subject: ${cleanSubject}`,
                "",
                "CUSTOMER MESSAGE",
                "----------------",
                cleanMessage,
                "",
                `Submitted At: ${newContact.createdAt.toISOString()}`,
                `Enquiry ID: ${newContact._id}`,
                "",
                "Reply directly to this email to respond to the customer.",
            ].join("\n"),

            // HTML version
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                        content="width=device-width, initial-scale=1.0">
                    <title>I Computers Customer Enquiry</title>
                </head>

                <body style="
                    margin: 0;
                    padding: 24px 12px;
                    background-color: #f3f4f6;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #1f2937;
                ">
                    <div style="
                        max-width: 680px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border: 1px solid #e5e7eb;
                        border-radius: 10px;
                        overflow: hidden;
                    ">
                        <div style="
                            padding: 26px 30px;
                            background-color: #1d4ed8;
                            color: #ffffff;
                        ">
                            <p style="
                                margin: 0 0 8px;
                                font-size: 12px;
                                letter-spacing: 1.5px;
                                text-transform: uppercase;
                            ">
                                I Computers
                            </p>

                            <h1 style="
                                margin: 0;
                                font-size: 24px;
                                line-height: 1.4;
                            ">
                                New Customer Enquiry
                            </h1>

                            <p style="
                                margin: 10px 0 0;
                                font-size: 14px;
                                color: #dbeafe;
                            ">
                                A new message has been received from your website.
                            </p>
                        </div>

                        <div style="padding: 28px 30px;">
                            <p style="
                                margin: 0 0 22px;
                                font-size: 15px;
                                line-height: 1.7;
                            ">
                                Hello I Computers Team,<br><br>
                                A customer has submitted an enquiry through
                                the Contact Us form. Details are provided below.
                            </p>

                            <table
                                role="presentation"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                style="
                                    width: 100%;
                                    border-collapse: collapse;
                                    font-size: 14px;
                                "
                            >
                                <tr>
                                    <td style="
                                        width: 145px;
                                        padding: 13px;
                                        border: 1px solid #e5e7eb;
                                        background: #f9fafb;
                                        font-weight: bold;
                                        vertical-align: top;
                                    ">
                                        Customer Name
                                    </td>
                                    <td style="
                                        padding: 13px;
                                        border: 1px solid #e5e7eb;
                                        overflow-wrap: anywhere;
                                    ">
                                        ${safeName}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="
                                        padding: 13px;
                                        border: 1px solid #e5e7eb;
                                        background: #f9fafb;
                                        font-weight: bold;
                                        vertical-align: top;
                                    ">
                                        Customer Email
                                    </td>
                                    <td style="
                                        padding: 13px;
                                        border: 1px solid #e5e7eb;
                                        overflow-wrap: anywhere;
                                    ">
                                        ${safeEmail}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="
                                        padding: 13px;
                                        border: 1px solid #e5e7eb;
                                        background: #f9fafb;
                                        font-weight: bold;
                                        vertical-align: top;
                                    ">
                                        Subject
                                    </td>
                                    <td style="
                                        padding: 13px;
                                        border: 1px solid #e5e7eb;
                                        overflow-wrap: anywhere;
                                    ">
                                        ${safeSubject}
                                    </td>
                                </tr>
                            </table>

                            <h2 style="
                                margin: 28px 0 12px;
                                font-size: 17px;
                                color: #111827;
                            ">
                                Customer Message
                            </h2>

                            <div style="
                                padding: 18px;
                                background-color: #f9fafb;
                                border-left: 4px solid #2563eb;
                                border-radius: 4px;
                                font-size: 14px;
                                line-height: 1.8;
                                white-space: pre-wrap;
                                overflow-wrap: anywhere;
                            ">${safeMessage}</div>

                            <div style="
                                margin-top: 26px;
                                padding-top: 18px;
                                border-top: 1px solid #e5e7eb;
                                font-size: 12px;
                                line-height: 1.8;
                                color: #6b7280;
                            ">
                                <p style="margin: 0 0 5px;">
                                    <strong>Submitted At:</strong>
                                    ${safeCreatedAt}
                                </p>

                                <p style="margin: 0;">
                                    <strong>Enquiry ID:</strong>
                                    ${safeEnquiryId}
                                </p>
                            </div>

                            <p style="
                                margin: 24px 0 0;
                                font-size: 13px;
                                line-height: 1.7;
                                color: #4b5563;
                            ">
                                <strong>Next step:</strong>
                                Use the Reply button in your email application
                                to respond directly to the customer.
                            </p>
                        </div>

                        <div style="
                            padding: 18px 30px;
                            background-color: #f9fafb;
                            border-top: 1px solid #e5e7eb;
                            text-align: center;
                            font-size: 12px;
                            color: #6b7280;
                        ">
                            This is an automated notification from
                            the I Computers website Contact Us form.
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        // 11. Send notification to the admin
        const info = await transporter.sendMail(mailOptions);

        console.log(
            "I Computers enquiry email accepted by mail server:",
            info.messageId
        );

        // 12. Return success
        return res.status(201).json({
            message: "Your message has been submitted successfully",
            contact: {
                id: newContact._id,
                name: newContact.name,
                email: newContact.email,
                subject: newContact.subject,
                createdAt: newContact.createdAt,
            },
        });
    } catch (error) {
        console.error("Contact Us error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Please check your submitted details",
            });
        }

        return res.status(500).json({
            message:
                "We could not complete your request. Your message may already have been saved. Please check before submitting again.",
        });
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

// get all users
export async function getAllUsers(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden",
		});
		return;
	}
	try {
		const pageSizeInString = req.params.pageSize || "10";

		const pageNumberInString = req.params.pageNumber || "1";

		const pageSize = parseInt(pageSizeInString);

		const pageNumber = parseInt(pageNumberInString);

		const numberOfUsers = await User.countDocuments();

		const numberOfPages = Math.ceil(numberOfUsers / pageSize);

		const users = await User.find({})
			.skip((pageNumber - 1) * pageSize)
			.limit(pageSize);

		res.json({
			users: users,
			totalPages: numberOfPages,
		});
	} catch (error) {
		res.status(500).json({ message: "Error getting users", error: error });
	}
}

// block user or unblock user
export async function blockOrUnblockUser(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden",
		});
		return;
	}

	const email = req.body.email;

	if (req.user.email == email) {
		res.status(400).json({
			message: "You cannot block yourself",
		});
		return;
	}
	try {
		const user = await User.findOne({ email: email });

		if (user == null) {
			res.status(404).json({ message: "User with given email not found" });
			return;
		}
		await User.updateOne({ email: email }, { isBlocked: !user.isBlocked });
		res.json({
			message: user.isBlocked
				? "User unblocked successfully"
				: "User blocked successfully",
		});
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error blocking/unblocking user", error: error });
	}
}

// change the role 
export async function changeRole(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden",
		});
		return;
	}

	const email = req.body.email;

	if (req.user.email == email) {
		res.status(400).json({
			message: "You cannot change your own role",
		});
		return;
	}
	try {
		const user = await User.findOne({ email: email });

		if (user == null) {
			res.status(404).json({ message: "User with given email not found" });
			return;
		}
		await User.updateOne(
			{ email: email },
			{ role: user.role == "admin" ? "customer" : "admin" },
		);
		res.json({
			message:
				user.role == "admin"
					? "User role changed to customer successfully"
					: "User role changed to admin successfully",
		});
	} catch (error) {
		res.status(500).json({ message: "Error changing user role", error: error });
	}
}