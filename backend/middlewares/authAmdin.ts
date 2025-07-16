import jwt from "jsonwebtoken";

// Admin authentication middleware
const authAdmin = async (req, res, next) => {
  try {
    // Destructure the token from the request headers
    const { atoken } = req.headers;

    // If no token is found, return an unauthorized response
    if (!atoken) {
      return res.json({ success: false, message: "Not Authorized Login Again" });
    }

    // Verify and decode the JWT using the secret key
    const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);

    // Check if the decoded token matches the expected admin identity
    // This assumes the token payload is a string like: "admin@example.comadmin123"
    const expected = process.env.ADMIN_EMAIL! + process.env.ADMIN_PASSWORD;
    if (token_decode !== expected) {
      return res.json({ success: false, message: "Not Authorized Login Again" });
    }

    // If all checks pass, continue to the next middleware or route
    next();
  } catch (error) {
    // If an error occurs (e.g., token expired or invalid), log and respond
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authAdmin;
