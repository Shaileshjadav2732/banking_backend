import jwt from "jsonwebtoken";

export const isAuth = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not authenticated.");
    // Not authenticated!
    error.statusCode = 401;
    throw error;
  }
  //   Extracting token only removing Bearer form whole authorization header!
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "somesupersecretsecret");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }

  //   Checking if JWT can't verify token!
  if (!decodedToken) {
    const error = new Error("Not authenticated.");
    error.statusCode = 500;
    throw error;
  }
  //   Setting userId with each req so we can use it!
  req.userId = decodedToken.userId;
  next();
};
