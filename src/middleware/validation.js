const { isEmpty, isValidEmail, sanitizeString } = require('../utils/helpers');

/**
 * Validate entry data
 */
const validateEntry = (req, res, next) => {
    try {
        const { nama, no_resi, berat_resi, berat_aktual } = req.body;
        const errors = [];

        // Validate nama
        if (isEmpty(nama)) {
            errors.push('Nama harus diisi');
        } else if (nama.trim().length < 3) {
            errors.push('Nama minimal 3 karakter');
        } else if (nama.trim().length > 100) {
            errors.push('Nama maksimal 100 karakter');
        }

        // Validate no_resi
        if (isEmpty(no_resi)) {
            errors.push('No Resi harus diisi');
        } else if (no_resi.trim().length < 5) {
            errors.push('No Resi minimal 5 karakter');
        } else if (no_resi.trim().length > 50) {
            errors.push('No Resi maksimal 50 karakter');
        }

        // Validate berat_resi
        if (isEmpty(berat_resi)) {
            errors.push('Berat Resi harus diisi');
        } else {
            const beratResiNum = parseFloat(berat_resi);
            if (isNaN(beratResiNum)) {
                errors.push('Berat Resi harus berupa angka');
            } else if (beratResiNum <= 0) {
                errors.push('Berat Resi harus lebih dari 0');
            } else if (beratResiNum > 10000) {
                errors.push('Berat Resi maksimal 10000 KG');
            }
        }

        // Validate berat_aktual
        if (isEmpty(berat_aktual)) {
            errors.push('Berat Aktual harus diisi');
        } else {
            const beratAktualNum = parseFloat(berat_aktual);
            if (isNaN(beratAktualNum)) {
                errors.push('Berat Aktual harus berupa angka');
            } else if (beratAktualNum <= 0) {
                errors.push('Berat Aktual harus lebih dari 0');
            } else if (beratAktualNum > 10000) {
                errors.push('Berat Aktual maksimal 10000 KG');
            }
        }

        // If there are errors, return them
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: errors
            });
        }

        // Sanitize inputs
        req.body.nama = sanitizeString(nama);
        req.body.no_resi = sanitizeString(no_resi);
        
        if (req.body.catatan) {
            req.body.catatan = sanitizeString(req.body.catatan);
        }

        next();
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat validasi'
        });
    }
};

/**
 * Validate entry with URLs (for client-side upload)
 */
const validateEntryWithUrls = (req, res, next) => {
    try {
        const { foto_url_1, foto_url_2 } = req.body;
        const errors = [];

        // First validate basic entry data
        const entryValidation = validateEntry(req, res, () => {});
        if (entryValidation) return;

        // Validate foto URLs
        if (isEmpty(foto_url_1) && isEmpty(foto_url_2)) {
            errors.push('Minimal 1 foto harus diupload');
        }

        if (foto_url_1 && !isValidUrl(foto_url_1)) {
            errors.push('URL Foto 1 tidak valid');
        }

        if (foto_url_2 && !isValidUrl(foto_url_2)) {
            errors.push('URL Foto 2 tidak valid');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: errors
            });
        }

        next();
    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat validasi'
        });
    }
};

/**
 * Validate file upload
 */
const validateFileUpload = (req, res, next) => {
    try {
        const files = req.files;
        const errors = [];

        if (!files || files.length === 0) {
            errors.push('Minimal 1 foto harus diupload');
        } else if (files.length > 2) {
            errors.push('Maksimal 2 foto dapat diupload');
        }

        // Validate each file
        if (files && files.length > 0) {
            files.forEach((file, index) => {
                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    errors.push(`Foto ${index + 1} terlalu besar (maksimal 5MB)`);
                }

                // Check file type
                const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedMimes.includes(file.mimetype)) {
                    errors.push(`Foto ${index + 1} harus berformat JPG, PNG, atau WebP`);
                }
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validasi file gagal',
                errors: errors
            });
        }

        next();
    } catch (error) {
        console.error('File validation error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat validasi file'
        });
    }
};

/**
 * Validate update entry
 */
const validateUpdateEntry = (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const errors = [];

        // Validate ID
        if (!id || isNaN(parseInt(id))) {
            errors.push('ID tidak valid');
        }

        // Validate status if provided
        if (status !== undefined) {
            const validStatuses = ['submitted', 'reviewed', 'approved', 'rejected'];
            if (!validStatuses.includes(status)) {
                errors.push('Status tidak valid. Gunakan: submitted, reviewed, approved, rejected');
            }
        }

        // Validate notes if provided
        if (notes !== undefined && notes !== null) {
            if (typeof notes !== 'string') {
                errors.push('Catatan harus berupa teks');
            } else if (notes.length > 500) {
                errors.push('Catatan maksimal 500 karakter');
            }
        }

        // Check if at least one field is being updated
        if (status === undefined && notes === undefined) {
            errors.push('Tidak ada data yang diupdate');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: errors
            });
        }

        // Sanitize notes if provided
        if (notes) {
            req.body.notes = sanitizeString(notes);
        }

        next();
    } catch (error) {
        console.error('Update validation error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat validasi'
        });
    }
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
    try {
        let { page, limit } = req.query;

        // Set defaults
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        // Validate ranges
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 100) limit = 100;

        // Update query params
        req.query.page = page;
        req.query.limit = limit;

        next();
    } catch (error) {
        console.error('Pagination validation error:', error);
        next();
    }
};

/**
 * Validate export parameters
 */
const validateExport = (req, res, next) => {
    try {
        const { startDate, endDate, format, columns } = req.query;
        const errors = [];

        // Validate dates if provided
        if (startDate && !isValidDate(startDate)) {
            errors.push('Format tanggal mulai tidak valid (gunakan YYYY-MM-DD)');
        }

        if (endDate && !isValidDate(endDate)) {
            errors.push('Format tanggal akhir tidak valid (gunakan YYYY-MM-DD)');
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.push('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
        }

        // Validate format if provided
        if (format && !['csv', 'excel'].includes(format)) {
            errors.push('Format export harus csv atau excel');
        }

        // Validate columns if provided
        if (columns) {
            try {
                const parsedColumns = JSON.parse(columns);
                if (!Array.isArray(parsedColumns)) {
                    errors.push('Columns harus berupa array');
                }
            } catch (e) {
                errors.push('Format columns tidak valid');
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: errors
            });
        }

        next();
    } catch (error) {
        console.error('Export validation error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat validasi'
        });
    }
};

/**
 * Validate login
 */
const validateLogin = (req, res, next) => {
    try {
        const { username, password } = req.body;
        const errors = [];

        if (isEmpty(username)) {
            errors.push('Username harus diisi');
        }

        if (isEmpty(password)) {
            errors.push('Password harus diisi');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: errors
            });
        }

        req.body.username = sanitizeString(username);

        next();
    } catch (error) {
        console.error('Login validation error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat validasi'
        });
    }
};

/**
 * Validate registration
 */
const validateRegister = (req, res, next) => {
    try {
        const { username, password, email, full_name } = req.body;
        const errors = [];

        // Validate username
        if (isEmpty(username)) {
            errors.push('Username harus diisi');
        } else if (username.length < 3) {
            errors.push('Username minimal 3 karakter');
        } else if (username.length > 50) {
            errors.push('Username maksimal 50 karakter');
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Username hanya boleh mengandung huruf, angka, dan underscore');
        }

        // Validate password
        if (isEmpty(password)) {
            errors.push('Password harus diisi');
        } else if (password.length < 6) {
            errors.push('Password minimal 6 karakter');
        }

        // Validate email
        if (isEmpty(email)) {
            errors.push('Email harus diisi');
        } else if (!isValidEmail(email)) {
            errors.push('Format email tidak valid');
        }

        // Validate full name
        if (isEmpty(full_name)) {
            errors.push('Nama lengkap harus diisi');
        } else if (full_name.length < 3) {
            errors.push('Nama lengkap minimal 3 karakter');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: errors
            });
        }

        // Sanitize inputs
        req.body.username = sanitizeString(username).toLowerCase();
        req.body.email = sanitizeString(email).toLowerCase();
        req.body.full_name = sanitizeString(full_name);

        next();
    } catch (error) {
        console.error('Register validation error:', error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat validasi'
        });
    }
};

// Helper functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

module.exports = {
    validateEntry,
    validateEntryWithUrls,
    validateFileUpload,
    validateUpdateEntry,
    validatePagination,
    validateExport,
    validateLogin,
    validateRegister
};