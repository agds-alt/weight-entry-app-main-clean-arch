/**
 * Calculate selisih (difference) between berat resi and berat aktual
 * @param {number} beratResi - Weight from receipt
 * @param {number} beratAktual - Actual weight
 * @returns {number} Selisih value (2 decimal places)
 */
function calculateSelisih(beratResi, beratAktual) {
    try {
        const resi = parseFloat(beratResi);
        const aktual = parseFloat(beratAktual);

        if (isNaN(resi) || isNaN(aktual)) {
            throw new Error('Berat harus berupa angka');
        }

        const selisih = resi - aktual;
        return parseFloat(selisih.toFixed(2));
    } catch (error) {
        console.error('Calculate selisih error:', error);
        return 0;
    }
}

/**
 * Format date to Indonesian locale string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    try {
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '';
    }
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateSimple(date) {
    try {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        return '';
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
}

/**
 * Generate random string
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
function generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Check if value is empty
 * @param {*} value - Value to check
 * @returns {boolean} Is empty
 */
function isEmpty(value) {
    return (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && Object.keys(value).length === 0)
    );
}

/**
 * Format number to currency (IDR)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    try {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    } catch (error) {
        return 'Rp 0';
    }
}

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    try {
        return new Intl.NumberFormat('id-ID').format(num);
    } catch (error) {
        return '0';
    }
}

/**
 * Parse query string to object
 * @param {string} queryString - Query string to parse
 * @returns {object} Parsed object
 */
function parseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const obj = {};
    for (const [key, value] of params) {
        obj[key] = value;
    }
    return obj;
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename to extract extension from
 * @returns {string} File extension
 */
function getFileExtension(filename) {
    try {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
    } catch (error) {
        return '';
    }
}

/**
 * Check if file is image
 * @param {string} filename - Filename to check
 * @returns {boolean} Is image file
 */
function isImageFile(filename) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const ext = getFileExtension(filename);
    return imageExtensions.includes(ext);
}

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage (2 decimal places)
 */
function calculatePercentage(part, total) {
    try {
        if (total === 0) return 0;
        return parseFloat(((part / total) * 100).toFixed(2));
    } catch (error) {
        return 0;
    }
}

/**
 * Sleep function for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Result of function or error
 */
async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await sleep(delay * Math.pow(2, i));
        }
    }
}

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength = 50) {
    if (typeof str !== 'string') return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Convert object to query string
 * @param {object} obj - Object to convert
 * @returns {string} Query string
 */
function objectToQueryString(obj) {
    return Object.keys(obj)
        .filter(key => obj[key] !== null && obj[key] !== undefined)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
}

/**
 * Deep clone object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
function deepClone(obj) {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (error) {
        return obj;
    }
}

/**
 * Get current timestamp
 * @returns {number} Current timestamp
 */
function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Check if string is valid JSON
 * @param {string} str - String to check
 * @returns {boolean} Is valid JSON
 */
function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Remove duplicates from array
 * @param {Array} arr - Array with potential duplicates
 * @returns {Array} Array without duplicates
 */
function removeDuplicates(arr) {
    return [...new Set(arr)];
}

/**
 * Group array by key
 * @param {Array} arr - Array to group
 * @param {string} key - Key to group by
 * @returns {object} Grouped object
 */
function groupBy(arr, key) {
    return arr.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

module.exports = {
    calculateSelisih,
    formatDate,
    formatDateSimple,
    isValidEmail,
    sanitizeString,
    generateRandomString,
    isEmpty,
    formatCurrency,
    formatNumber,
    parseQueryString,
    getFileExtension,
    isImageFile,
    calculatePercentage,
    sleep,
    retryWithBackoff,
    truncateString,
    objectToQueryString,
    deepClone,
    getCurrentTimestamp,
    isValidJSON,
    removeDuplicates,
    groupBy
};