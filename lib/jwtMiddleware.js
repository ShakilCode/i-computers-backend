import jwt from 'jsonwebtoken'

// this middlewhere for check the jwt token
export default function authorizeUser(req, res, next) {

        // check Authorization in the header
        const header = req.header("Authorization")

        if(header != null){

            // there is display somehting like Bearer with the token remove it because out token does not have anything like that
            const token = header.replace("Bearer ", "")

            // decrypt the token
            // here there are 3 values, token, signature, and a arrow function(if decrypt what to do if not what to do)
            jwt.verify(token, "i-computers54!", 
                (err, decoded)=>{
                    if(decoded == null){
                        res.status(401).json({
                            message : "Invalid token please login again"
                        })
                    }else{
                        req.user = decoded
                        next()
                    }
                }
            )
        }else{
            next()
        }
    }