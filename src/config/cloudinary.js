const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
async function uploadImage(fileBuffer, options = {}) {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            resource_type: 'image',
            folder: options.folder || 'selisih-berat',
            public_id: options.publicId || undefined,
            overwrite: options.overwrite || true,
            transformation: options.transformation || [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        };

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<Object>} Delete result
 */
async function deleteImage(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
}

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs
 * @returns {Promise<Object>} Delete result
 */
async function deleteImages(publicIds) {
    try {
        const result = await cloudinary.api.delete_resources(publicIds);
        return result;
    } catch (error) {
        console.error('Cloudinary bulk delete error:', error);
        throw error;
    }
}

/**
 * Get image info from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<Object>} Image info
 */
async function getImageInfo(publicId) {
    try {
        const result = await cloudinary.api.resource(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary get info error:', error);
        throw error;
    }
}

/**
 * Generate upload signature
 * @param {Object} params - Parameters to sign
 * @returns {string} Signature
 */
function generateSignature(params) {
    try {
        const signature = cloudinary.utils.api_sign_request(
            params,
            process.env.CLOUDINARY_API_SECRET
        );
        return signature;
    } catch (error) {
        console.error('Generate signature error:', error);
        throw error;
    }
}

/**
 * Generate transformation URL
 * @param {string} publicId - Public ID of the image
 * @param {Object} transformation - Transformation options
 * @returns {string} Transformed image URL
 */
function getTransformationUrl(publicId, transformation = {}) {
    try {
        return cloudinary.url(publicId, {
            ...transformation,
            secure: true
        });
    } catch (error) {
        console.error('Get transformation URL error:', error);
        return '';
    }
}

/**
 * Generate thumbnail URL
 * @param {string} publicId - Public ID of the image
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} Thumbnail URL
 */
function getThumbnailUrl(publicId, width = 200, height = 200) {
    return getTransformationUrl(publicId, {
        width: width,
        height: height,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto:good'
    });
}

/**
 * List all images in a folder
 * @param {string} folder - Folder name
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Object>} List result
 */
async function listImages(folder, maxResults = 500) {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: folder,
            max_results: maxResults
        });
        return result;
    } catch (error) {
        console.error('List images error:', error);
        throw error;
    }
}

/**
 * Delete all images in a folder
 * @param {string} folder - Folder name
 * @returns {Promise<Object>} Delete result
 */
async function deleteFolder(folder) {
    try {
        const result = await cloudinary.api.delete_resources_by_prefix(folder);
        await cloudinary.api.delete_folder(folder);
        return result;
    } catch (error) {
        console.error('Delete folder error:', error);
        throw error;
    }
}

/**
 * Upload image from URL
 * @param {string} url - Image URL
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
async function uploadFromUrl(url, options = {}) {
    try {
        const uploadOptions = {
            folder: options.folder || 'selisih-berat',
            public_id: options.publicId || undefined,
            overwrite: options.overwrite || true
        };

        const result = await cloudinary.uploader.upload(url, uploadOptions);
        return result;
    } catch (error) {
        console.error('Upload from URL error:', error);
        throw error;
    }
}

/**
 * Check if Cloudinary is configured
 * @returns {boolean} Is configured
 */
function isConfigured() {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
}

/**
 * Test Cloudinary connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
    try {
        await cloudinary.api.ping();
        return true;
    } catch (error) {
        console.error('Cloudinary connection test failed:', error);
        return false;
    }
}

module.exports = cloudinary;

// Export additional utility functions
module.exports.uploadImage = uploadImage;
module.exports.deleteImage = deleteImage;
module.exports.deleteImages = deleteImages;
module.exports.getImageInfo = getImageInfo;
module.exports.generateSignature = generateSignature;
module.exports.getTransformationUrl = getTransformationUrl;
module.exports.getThumbnailUrl = getThumbnailUrl;
module.exports.listImages = listImages;
module.exports.deleteFolder = deleteFolder;
module.exports.uploadFromUrl = uploadFromUrl;
module.exports.isConfigured = isConfigured;
module.exports.testConnection = testConnection;