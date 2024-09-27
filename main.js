const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const verifyToken = require('./src/middleware/verifyAuthToken')
require('./src/configs/mysql_db');
require('dotenv').config();
var cors = require('cors')

// routes
const userRoutes = require('./src/routes/usersRoutes');
const fileRoutes = require('./src/routes/filesRoutes');
const directoriesRoutes = require('./src/routes/directoriesRoutes');

const app = express();
app.use(cors())
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    return res.status(200).send("Welcome to Amazon S3 Simple Cloud Storage")
});

app.use('/api/auth', userRoutes)
app.use('/api/files/', verifyToken.verifyToken, fileRoutes)
app.use('/api/directories', verifyToken.verifyToken, directoriesRoutes)

app.listen(PORT, (err) => {
    if(err) {
        console.log("Server has stopped due to an error");
    } else {
        console.log("Server is listening on port: " + process.env.PORT);
    }
})