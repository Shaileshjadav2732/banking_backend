import { app } from "./app.js";
import { connDb } from "./data/database.js";
import { config } from "dotenv";



connDb();

app.listen(process.env.PORT, () => {
  console.log(`server is working! on port ${port}`);
});

app.get("/", (req, res) => {
  res.send("Hello Man!");
});

    config({
      path: "./data/config.env",
    });
