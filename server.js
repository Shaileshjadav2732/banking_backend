
import { config } from 'dotenv';
import {connectDB }from './data/database.js';
import {app} from "./app.js"


   

config({
   path: "./data/config.env",
});


const PORT = process.env.PORT || 3000;

connectDB();

app.get('/', (req, res) => {
   res.send('Hello World!');
});

app.listen(process.env.PORT, () => {
   console.log(`Banking app listening at http://localhost:${PORT}`);
});