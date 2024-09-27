const express = require('express');
const directories = require('../controlllers/directoriesController');

const router = express.Router();

router.post('/create', directories.createDirectory);

router.get('/list', directories.getUserDirectories);

router.get('/:directoryId/files', directories.getFilesInDirectory);

module.exports = router;