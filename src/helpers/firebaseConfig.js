const { initializeApp } = require('firebase/app');
const { getStorage, ref } = require('firebase/storage');

const firebaseConfig = {
    apiKey: process.env.FB_API_KEY,
    authDomain: process.env.FB_AUTH_DOMAIN,
    projectId: process.env.FB_PROJECT_ID,
    storageBucket: process.env.FB_STORAGE_BUCKET,
    messagingSenderId: process.env.FB_MESSAGEING_SENDER_ID,
    appId: process.env.FB_APP_ID,
    measurementId: process.env.FB_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to Firebase Storage service
const storage = getStorage(app);

// Get a reference to the Firebase Storage bucket
const bucket = ref(storage, process.env.FB_STORAGE_BUCKET_URL);

module.exports = { bucket };
