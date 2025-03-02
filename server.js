require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
app.use(cors());

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
    }),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPG, JPEG, and PNG images are allowed!"), false);
        }
        cb(null, true);
    }
});


const API_KEY = process.env.FACE_API_KEY || 'unxzGJlkywFmtByOROmDu20wahM_cU_m';
const API_SECRET = process.env.FACE_API_SECRET || 'G3R03ni8EupyA9mvswGQJN5P3Qq0Nu8Z';
const FACE_API_URL = 'https://api-us.faceplusplus.com/facepp/v3/detect';

app.post('/analyze-mood', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            console.log("❌ No file uploaded.");
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log("📸 Image Uploaded:", req.file);

        const imageFilePath = req.file.path;
        const formData = new FormData();
        formData.append('api_key', API_KEY);
        formData.append('api_secret', API_SECRET);
        formData.append('image_file', fs.createReadStream(imageFilePath));
        formData.append('return_attributes', 'emotion');
        
        const headers = formData.getHeaders();
        
        const response = await axios.post(FACE_API_URL, formData, { headers });
        

        console.log("✅ Face++ API Response:", JSON.stringify(response.data, null, 2));

        if (!response.data.faces || response.data.faces.length === 0) {
            console.log("❌ No face detected in image.");
            return res.status(400).json({ error: 'No face detected. Try another image.' });
        }

        const faceData = response.data.faces[0]?.attributes?.emotion;
        const mood = detectMood(faceData);
        
        console.log("🎯 Extracted Mood:", mood);  // ✅ Log extracted mood
        fs.unlinkSync(imageFilePath);

        res.json({ mood, emotions: faceData });
    } catch (error) {
        console.error('❌ Error analyzing mood:', error.message);
        res.status(500).json({ error: 'Mood analysis failed. Please try again.' });
    }
});

function detectMood(emotion) {
    return Object.entries(emotion).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}

// ✅ START THE SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
