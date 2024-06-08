import mongoose from "mongoose";
export  const connectDB = () => {
   mongoose.connect(process.env.DATABASE_LINK, { dbName: "Bank" })
      .then((c) => console.log("database Connected"))
      .catch((e)=>console.log(e))

}
