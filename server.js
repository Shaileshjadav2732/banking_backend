import { app } from "./app.js";
import { connDb } from "./data/database.js";
import { config } from "dotenv";

const port = 5000;

connDb();

app.listen(port, () => {
  console.log(`server is working! on port ${port}`);
});

app.get("/", (req, res) => {
  res.send("Hello Man!");
});

    config({
      path: "./data/config.env",
    });
