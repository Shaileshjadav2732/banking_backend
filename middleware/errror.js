class ErrorHandler extends Error {
   constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
   }
} 

export const errorMiddleWare = (err, req, res, next) => {
   //basically if err.message is pass in controller then show it otherwise general error is below
   err.message = err.message || "Internal Server Error!";
   err.statusCode = err.statusCode || 500;

   console.log(err); //log that message that we pass in controller of delete

   return res.status(err.statusCode).json({
      success: "false",
     message: err.message,
   });
};

export default ErrorHandler;
