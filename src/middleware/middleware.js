const multer = require("multer");

// Multer configuration for handling file uploads
const upload = multer({
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB file size limit
    },
    fileFilter: (req, file, cb) => {
        console.log("step 1");
        if (file.mimetype.startsWith('image/')) {
            console.log("step 2");
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
});

module.exports = { upload }
