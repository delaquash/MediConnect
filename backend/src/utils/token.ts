import crypto from "crypto";

export function createSecureToken () {
    const raw = crypto.randomBytes(32).toString("hex")
    const hash = crypto.createHash("sha256").update(raw).digest("hex")
    return { raw, hash }
}

// to has the token/otp 
export const hashValue= (value: string)=> {
    return crypto.createHash("sha256").update(value).digest("hex")
}

// 6 digit OTP generator and return it hashed to the DB
export const createOTp =(digits =6) =>{
    const min = Math.pow(10, digits-1)
    const max = Math.pow(10, digits) - 1
    const otp = (Math.floor(Math.random() * (max - min + 1)) + min).toString()
    const hash = hashValue(otp)
    return { otp, hash }
}