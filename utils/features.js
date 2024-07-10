import jwt from "jsonwebtoken";
export const sendCookie = (admin, res, message, statusCode = 200) => {
   const adminId = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET);

   res
      .status(statusCode)
      .cookie("token", adminId, {
         httpOnly: "true",
         maxAge: 3600 * 1000,
         sameSite: "none",
         secure: "true"
      })
      .json({
         success: true,
         message,
         data: adminId
      });
};
