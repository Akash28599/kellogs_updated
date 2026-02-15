const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const MODELS_DIR = path.join(__dirname, '../models');
// Allow override via env, default to 'ai-models'
const CONTAINER_NAME = process.env.AI_MODELS_CONTAINER || 'ai-models';
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

const REQUIRED_MODELS = [
    'inswapper_128.onnx',
    'w600k_r50.onnx',
    'face_landmarker.task'
];

async function downloadModels() {
    console.log('🔍 Checking AI models...');

    if (!CONNECTION_STRING) {
        console.warn('⚠️ AZURE_STORAGE_CONNECTION_STRING missing. Skipping model download.');
        return;
    }

    if (!fs.existsSync(MODELS_DIR)) {
        fs.mkdirSync(MODELS_DIR, { recursive: true });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Verify container might not exist if user hasn't created it yet
    // But we proceed assuming it exists.

    for (const fileName of REQUIRED_MODELS) {
        const filePath = path.join(MODELS_DIR, fileName);

        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            // Check if file is non-empty (simple validation)
            if (stats.size > 0) {
                console.log(`✅ Model found locally: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                continue;
            }
        }

        console.log(`⬇️ Model missing: ${fileName}. Downloading from Azure container '${CONTAINER_NAME}'...`);
        try {
            const blockBlobClient = containerClient.getBlockBlobClient(fileName);
            // Check directly if exists
            const exists = await blockBlobClient.exists();
            if (!exists) {
                console.warn(`⚠️ Model file '${fileName}' NOT FOUND in Azure container '${CONTAINER_NAME}'. Skipping.`);
                continue;
            }

            const downloadBlockBlobResponse = await blockBlobClient.download(0);

            const fileStream = fs.createWriteStream(filePath);
            downloadBlockBlobResponse.readableStreamBody.pipe(fileStream);

            await new Promise((resolve, reject) => {
                fileStream.on('finish', resolve);
                fileStream.on('error', reject);
            });

            console.log(`✅ Successfully downloaded: ${fileName}`);
        } catch (err) {
            console.error(`❌ Error downloading ${fileName}:`, err.message);
            // Don't crash the server, just log. The app might fail later if model is strictly required.
        }
    }
}

downloadModels().catch(err => {
    console.error('❌ Fatal error in model download script:', err);
    process.exit(1);
});
