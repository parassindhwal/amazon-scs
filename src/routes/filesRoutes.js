const express = require('express');
const files = require('../controlllers/filesController');
const {handleFileUpload} = require('../middleware/handleFileUpload')

const router = express.Router();

//Route for uploading a file to the user's storage space
router.post('/upload', handleFileUpload, files.uploadFile);

// Route for downloading a file by its ID.
router.get('/download/:fileId', files.downloadFile);

router.get('/list', files.listFiles);

router.get('/search', files.searchFiles);

router.post('/:fileId/permissions', files.setFilePermissions);

router.get('/:fileId/versions', files.getAllFileVersion);

router.get('/:fileId/versions/:versionId', files.getFileVersion);

router.put('/:fileId/versions/:versionId/restore', files.restoreFileVersion);

router.post('/:fileId/metadata', files.addFileMetadata);

router.delete('/delete', files.deleteFiles);

module.exports = router;