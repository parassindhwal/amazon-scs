const multer = require('multer');
const fs = require('fs');

//set the path to upload folder
const uploadFolder = 'uploads';

if(!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}


const storage = multer.diskStorage({
    destination: function (req, res, cb) {
        const user = req.user
        const userUploadsFolder = `${uploadFolder}/user_${user.id}`

        if(!fs.existsSync(userUploadsFolder)){
            fs.mkdirSync(userUploadsFolder);
        }

        cb(null, userUploadsFolder);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({
    storage: storage,
    limits: {
        // fileSize: 10 * 1024 * 1024,
        files: 10
    },
    fileFilter: function(req, file, cb) {
        cb(null, true);
    }
}).array('files')

const handleFileUpload = (req, res, next) => {
    upload(req, res, function(err) {
        if(err instanceof multer.MulterError) {
            if(err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ 
                    success: false,
                    message: 'Cannot upload more than 10 files at once'
                })
            } else if(err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    success: false,
                    message: 'Cannot upload more than 10MB file at once'
                })
            } else if(err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                })
            }
        }
        next();
    });
};

module.exports= {
    handleFileUpload
}