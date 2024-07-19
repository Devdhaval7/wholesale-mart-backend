const multer = require('multer');

// Multer configuration for handling file uploads
const storage = multer.memoryStorage(); // Store files in memory instead of disk

const multerConfig = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB file size limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || !file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

module.exports = { multerConfig };
