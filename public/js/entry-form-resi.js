// entry-form-resi.js - Upload saat submit
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userName = localStorage.getItem('userName');
    
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Form elements
    const form = document.getElementById('entryForm');
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const successMessage = document.getElementById('successMessage');
    
    // Weight fields
    const beratResiInput = document.getElementById('beratResi');
    const beratAktualInput = document.getElementById('beratAktual');
    const selisihDisplay = document.getElementById('selisihDisplay');
    const selisihValue = document.getElementById('selisihValue');
    const selisihStatus = document.getElementById('selisihStatus');
    
    // Image upload elements
    const uploadSection1 = document.getElementById('uploadSection1');
    const uploadSection2 = document.getElementById('uploadSection2');
    const foto1Input = document.getElementById('foto1');
    const foto2Input = document.getElementById('foto2');
    const imagePreviewGrid = document.getElementById('imagePreviewGrid');
    
    // ✅ Simpan file objects, bukan URL
    let selectedFiles = {
        foto1: null,
        foto2: null
    };

  // Ganti bagian Cloudinary configuration dengan ini:
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; // Upload preset default Cloudinary
const CLOUDINARY_CLOUD_NAME = 'ddzzlusek'; // Pastikan ini benar
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Upload image to Cloudinary - dengan error handling yang lebih baik
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Hapus folder dulu untuk testing, atau gunakan folder yang lebih simple
    // formData.append('folder', `weight-entries/${userName}`);
    formData.append('folder', 'weight-entries'); // Folder yang lebih simple

    try {
        console.log('📤 Uploading file to Cloudinary...', {
            file: file.name,
            size: file.size,
            type: file.type
        });

        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: 'POST',
            body: formData
        });

        console.log('☁️ Cloudinary response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Cloudinary upload failed:', errorText);
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Cloudinary upload success:', data.secure_url);
        return data.secure_url;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        throw new Error('Gagal upload foto ke Cloudinary: ' + error.message);
    }
}

    // Upload semua files ke Cloudinary - dipanggil saat submit
    async function uploadAllFiles() {
        const uploadPromises = [];
        const uploadedUrls = { foto1: null, foto2: null };

        if (selectedFiles.foto1) {
            uploadPromises.push(
                uploadToCloudinary(selectedFiles.foto1)
                    .then(url => { uploadedUrls.foto1 = url; })
                    .catch(error => {
                        console.error('Upload foto1 failed:', error);
                        // Continue without foto1
                    })
            );
        }

        if (selectedFiles.foto2) {
            uploadPromises.push(
                uploadToCloudinary(selectedFiles.foto2)
                    .then(url => { uploadedUrls.foto2 = url; })
                    .catch(error => {
                        console.error('Upload foto2 failed:', error);
                        // Continue without foto2
                    })
            );
        }

        // Tunggu semua upload selesai
        await Promise.all(uploadPromises);
        return uploadedUrls;
    }

    // Calculate and display selisih (difference)
    function calculateSelisih() {
        const beratResi = parseFloat(beratResiInput.value) || 0;
        const beratAktual = parseFloat(beratAktualInput.value) || 0;
        
        if (beratResi > 0 && beratAktual > 0) {
            const selisih = beratAktual - beratResi;
            
            // Display selisih
            selisihDisplay.style.display = 'block';
            selisihValue.textContent = `${Math.abs(selisih).toFixed(2)} kg`;
            
            // Update styling based on positive/negative difference
            if (selisih > 0) {
                selisihDisplay.classList.remove('selisih-negative');
                selisihDisplay.classList.add('selisih-positive');
                selisihStatus.textContent = 'Berat aktual lebih berat dari resi';
            } else if (selisih < 0) {
                selisihDisplay.classList.remove('selisih-positive');
                selisihDisplay.classList.add('selisih-negative');
                selisihStatus.textContent = 'Berat aktual lebih ringan dari resi';
            } else {
                selisihDisplay.classList.remove('selisih-positive', 'selisih-negative');
                selisihStatus.textContent = 'Berat aktual sama dengan resi';
            }
            
            return selisih;
        } else {
            selisihDisplay.style.display = 'none';
            return 0;
        }
    }

    // Add event listeners for weight inputs
    beratResiInput.addEventListener('input', calculateSelisih);
    beratAktualInput.addEventListener('input', calculateSelisih);

    // Upload section click handlers
    uploadSection1.addEventListener('click', function(e) {
        if (e.target.closest('.remove-image')) return;
        foto1Input.click();
    });

    uploadSection2.addEventListener('click', function(e) {
        if (e.target.closest('.remove-image')) return;
        foto2Input.click();
    });

    // Handle file selection - HANYA SIMPAN FILE, TIDAK UPLOAD
    function handleFileSelect(file, photoNumber) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Ukuran file terlalu besar. Maksimal 5MB.');
            return;
        }

        // Simpan file object - TIDAK UPLOAD KE CLOUDINARY
        if (photoNumber === 1) {
            selectedFiles.foto1 = file;
        } else {
            selectedFiles.foto2 = file;
        }

        // Tampilkan preview lokal saja
        displayImagePreview(file, photoNumber);
    }

    // Display image preview - HANYA PREVIEW LOKAL
    function displayImagePreview(file, photoNumber) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const uploadSection = document.getElementById(`uploadSection${photoNumber}`);
            const previewContainer = document.getElementById(`preview${photoNumber}`);
            const imagePreview = document.getElementById(`imagePreview${photoNumber}`);
            
            // Update image dengan URL lokal
            imagePreview.src = e.target.result;
            
            // Show preview
            document.getElementById('imagePreviewGrid').style.display = 'grid';
            previewContainer.style.display = 'block';
            
            // Update upload section - TAMPILKAN "Siap diupload"
            uploadSection.innerHTML = `
                <div class="text-warning">
                    <i class="fas fa-clock me-2"></i>Foto siap diupload
                    <br><small class="text-muted">Akan diupload saat submit</small>
                </div>
            `;
            uploadSection.classList.add('has-image');
        };
        
        reader.readAsDataURL(file);
    }

    // File input change handlers
    foto1Input.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0], 1);
        }
    });

    foto2Input.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0], 2);
        }
    });

    // Remove image handler
    window.removeImage = function(photoNumber) {
        if (photoNumber === 1) {
            selectedFiles.foto1 = null;
            document.getElementById('preview1').style.display = 'none';
        } else {
            selectedFiles.foto2 = null;
            document.getElementById('preview2').style.display = 'none';
        }
        resetUploadSection(photoNumber);
    };

    // Reset upload section
    function resetUploadSection(photoNumber) {
        const uploadSection = document.getElementById(`uploadSection${photoNumber}`);
        const placeholderHTML = photoNumber === 1 ? 
            `<div id="uploadPlaceholder1">
                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                <h6>Click untuk upload atau drag & drop</h6>
                <p class="text-muted">Foto resi/label pengiriman</p>
            </div>` :
            `<div id="uploadPlaceholder2">
                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                <h6>Click untuk upload atau drag & drop</h6>
                <p class="text-muted">Foto hasil timbangan</p>
            </div>`;
        
        uploadSection.classList.remove('has-image');
        uploadSection.innerHTML = placeholderHTML;
    }

    // Show success message
    function showSuccessMessage(message) {
        const successText = document.getElementById('successText');
        if (successText) {
            successText.textContent = message;
            successMessage.style.display = 'block';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        }
    }

    // Client-side validation
    function validateFormData(data) {
        const errors = [];
        
        if (!data.nama || data.nama.trim() === '') {
            errors.push('• Nama harus diisi');
        } else if (data.nama.length < 2) {
            errors.push('• Nama minimal 2 karakter');
        }

        if (!data.no_resi || data.no_resi.trim() === '') {
            errors.push('• No Resi harus diisi');
        } else if (data.no_resi.length < 3) {
            errors.push('• No Resi minimal 3 karakter');
        }

        if (!data.berat_resi || data.berat_resi <= 0) {
            errors.push('• Berat Resi harus lebih dari 0');
        }

        if (!data.berat_aktual || data.berat_aktual <= 0) {
            errors.push('• Berat Aktual harus lebih dari 0');
        }

        if (isNaN(data.berat_resi)) {
            errors.push('• Berat Resi harus berupa angka');
        }

        if (isNaN(data.berat_aktual)) {
            errors.push('• Berat Aktual harus berupa angka');
        }

        return errors;
    }

    // Reset form function
    function resetForm() {
        form.reset();
        selectedFiles = { foto1: null, foto2: null };
        document.getElementById('preview1').style.display = 'none';
        document.getElementById('preview2').style.display = 'none';
        document.getElementById('imagePreviewGrid').style.display = 'none';
        resetUploadSection(1);
        resetUploadSection(2);
        document.getElementById('selisihDisplay').style.display = 'none';
    }

    // Form submission - ✅ UPLOAD FOTO DI SINI SAAT SUBMIT
// Form submission - dengan debugging yang lebih detail
// Form submission - perbaiki field names
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('🔄 Starting form submission...');
    
    // Calculate selisih
    const beratResi = parseFloat(document.getElementById('beratResi').value) || 0;
    const beratAktual = parseFloat(document.getElementById('beratAktual').value) || 0;
    const selisih = beratAktual - beratResi;
    
    // Validasi client-side
    const validationData = {
        nama: document.getElementById('nama').value.trim(),
        no_resi: document.getElementById('noResi').value.toUpperCase().trim(),
        berat_resi: beratResi,
        berat_aktual: beratAktual
    };

    const validationErrors = validateFormData(validationData);
    if (validationErrors.length > 0) {
        alert('Error validasi:\n' + validationErrors.join('\n'));
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Mengupload dan Menyimpan...';
    
    try {
        // ✅ UPLOAD FOTO KE CLOUDINARY
        console.log('☁️ Uploading files to Cloudinary...');
        let uploadedUrls = { foto1: null, foto2: null };
        
        try {
            uploadedUrls = await uploadAllFiles();
            console.log('✅ Upload completed:', uploadedUrls);
        } catch (uploadError) {
            console.warn('⚠️ Upload failed, continuing without images:', uploadError);
        }

        // ✅ SESUAIKAN DENGAN SCHEMA DATABASE
        const entryData = {
            nama: validationData.nama,
            no_resi: validationData.no_resi,
            berat_resi: beratResi,
            berat_aktual: beratAktual,
            selisih: parseFloat(selisih.toFixed(2)), // Convert to number
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value?.trim() || '', // ❗UBAH: catatan → notes
            created_by: userName,
            foto_url_1: uploadedUrls.foto1,
            foto_url_2: uploadedUrls.foto2
        };

        console.log('📨 Final data to send:', entryData);

        // Kirim data ke server
        const response = await fetch('/api/entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(entryData)
        });

        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            let errorMessage = 'Gagal menyimpan data';
            try {
                const errorResult = await response.json();
                console.error('❌ Server error details:', errorResult);
                errorMessage = errorResult.message || errorMessage;
                
                // Tambahkan detail error jika ada
                if (errorResult.details) {
                    errorMessage += `\nDetail: ${JSON.stringify(errorResult.details)}`;
                }
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Response data:', result);

        if (result.success) {
            showSuccessMessage('Data berhasil disimpan! No. Resi: ' + entryData.no_resi);
            setTimeout(() => {
                resetForm();
            }, 2000);
        } else {
            throw new Error(result.message || 'Gagal menyimpan data');
        }
    } catch (error) {
        console.error('❌ Submit error:', error);
        alert('Error: ' + error.message);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i> Simpan Data';
    }
});
    // Reset button handler
    resetBtn.addEventListener('click', function() {
        if (confirm('Reset semua data yang telah diisi?')) {
            resetForm();
        }
    });

    // Auto-format nomor resi to uppercase
    document.getElementById('noResi').addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase();
    });

    // Add animation to form sections on load
    document.querySelectorAll('.form-section').forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            section.style.transition = 'all 0.5s ease-out';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 100);
    });
});