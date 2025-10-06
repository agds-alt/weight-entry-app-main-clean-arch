// data-management.js - Save this in public/js/data-management.js
// Handle data table with filters and pagination

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // State variables
    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // Elements
    const loadingOverlay = document.getElementById('loadingOverlay');
    const dataTableBody = document.getElementById('dataTableBody');
    const noDataDiv = document.getElementById('noData');
    const pagination = document.getElementById('pagination');
    
    // Filter elements
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const categorySelect = document.getElementById('filterCategory');
    const nameInput = document.getElementById('filterName');
    const applyFilterBtn = document.getElementById('applyFilter');
    const resetFilterBtn = document.getElementById('resetFilter');
    const exportBtn = document.getElementById('exportData');

    // Stats elements
    const totalEntriesEl = document.getElementById('totalEntries');
    const avgWeightEl = document.getElementById('avgWeight');
    const todayEntriesEl = document.getElementById('todayEntries');
    const weeklyGrowthEl = document.getElementById('weeklyGrowth');

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    endDateInput.value = today.toISOString().split('T')[0];
    startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];

    // Initial load
    loadData();

    // Load data from API
    async function loadData() {
        showLoading(true);
        
        try {
            const response = await fetch('/api/entries', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                allData = result.entries || [];
                
                // Apply initial filter
                applyFilters();
                updateStatistics();
            } else {
                console.error('Failed to load data');
                showNoData();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            showNoData();
        } finally {
            showLoading(false);
        }
    }

    // Apply filters
    function applyFilters() {
        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value + 'T23:59:59') : null;
        const category = categorySelect.value;
        const nameFilter = nameInput.value.toLowerCase();

        filteredData = allData.filter(item => {
            // Date filter
            if (startDate && new Date(item.measure_date) < startDate) return false;
            if (endDate && new Date(item.measure_date) > endDate) return false;
            
            // Category filter
            if (category && item.category !== category) return false;
            
            // Name filter
            if (nameFilter && !item.full_name.toLowerCase().includes(nameFilter)) return false;
            
            return true;
        });

        // Reset to first page
        currentPage = 1;
        
        // Render filtered data
        renderTable();
        renderPagination();
    }

    // Render table
    function renderTable() {
        if (filteredData.length === 0) {
            showNoData();
            return;
        }

        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
        const pageData = filteredData.slice(startIndex, endIndex);

        // Clear table
        dataTableBody.innerHTML = '';
        noDataDiv.style.display = 'none';

        // Render rows
        pageData.forEach((item, index) => {
            const row = createTableRow(item, startIndex + index + 1);
            dataTableBody.appendChild(row);
        });

        // Update showing info
        document.getElementById('showingFrom').textContent = startIndex + 1;
        document.getElementById('showingTo').textContent = endIndex;
        document.getElementById('totalRecords').textContent = filteredData.length;
    }

    // Create table row
    function createTableRow(item, number) {
        const row = document.createElement('tr');
        
        // Calculate BMI
        const heightInM = item.height / 100;
        const bmi = (item.weight / (heightInM * heightInM)).toFixed(1);
        
        // Calculate difference
        const difference = item.target_weight ? 
            (item.weight - item.target_weight).toFixed(1) : '-';
        const diffClass = difference > 0 ? 'text-danger' : 'text-success';
        
        row.innerHTML = `
            <td>${number}</td>
            <td>
                ${item.photo_url ? 
                    `<img src="${item.photo_url}" alt="Photo" class="table-image" onclick="showImageModal('${item.photo_url}')">` : 
                    '<i class="fas fa-image text-muted"></i>'}
            </td>
            <td><strong>${item.full_name}</strong></td>
            <td>${formatDate(item.measure_date)}</td>
            <td>${item.weight}</td>
            <td>${item.height}</td>
            <td>${bmi}</td>
            <td>${item.target_weight || '-'}</td>
            <td>
                <span class="badge-category badge-${item.category || 'general'}">
                    ${getCategoryLabel(item.category)}
                </span>
            </td>
            <td class="${diffClass}">
                ${difference !== '-' ? (difference > 0 ? '+' : '') + difference : '-'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editEntry(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteEntry(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }

    // Render pagination
    function renderPagination() {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        pagination.innerHTML = '';

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `
            <a class="page-link" href="#" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </a>
        `;
        pagination.appendChild(prevLi);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            // Show only nearby pages on mobile
            if (window.innerWidth < 768) {
                if (i > 1 && i < totalPages && Math.abs(i - currentPage) > 1) continue;
            }
            
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            pagination.appendChild(li);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </a>
        `;
        pagination.appendChild(nextLi);

        // Add click handlers
        pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.dataset.page);
                if (page && page !== currentPage && page > 0 && page <= totalPages) {
                    currentPage = page;
                    renderTable();
                    renderPagination();
                }
            });
        });
    }

    // Update statistics
    function updateStatistics() {
        // Total entries
        totalEntriesEl.textContent = allData.length;

        // Average weight
        if (allData.length > 0) {
            const avgWeight = allData.reduce((sum, item) => sum + parseFloat(item.weight), 0) / allData.length;
            avgWeightEl.textContent = avgWeight.toFixed(1) + ' kg';
        } else {
            avgWeightEl.textContent = '0 kg';
        }

        // Today's entries
        const today = new Date().toISOString().split('T')[0];
        const todayCount = allData.filter(item => 
            item.measure_date.startsWith(today)
        ).length;
        todayEntriesEl.textContent = todayCount;

        // Weekly growth (simplified calculation)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const thisWeek = allData.filter(item => new Date(item.measure_date) >= weekAgo).length;
        const lastWeek = allData.filter(item => {
            const date = new Date(item.measure_date);
            return date >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && date < weekAgo;
        }).length;
        
        const growth = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek * 100).toFixed(0) : 0;
        weeklyGrowthEl.textContent = (growth > 0 ? '+' : '') + growth + '%';
    }

    // Event listeners
    applyFilterBtn.addEventListener('click', applyFilters);
    
    resetFilterBtn.addEventListener('click', function() {
        startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
        categorySelect.value = '';
        nameInput.value = '';
        applyFilters();
    });

    // Export functionality
    exportBtn.addEventListener('click', function() {
        exportToCSV();
    });

    // Export to CSV
    function exportToCSV() {
        const headers = ['No', 'Nama', 'Tanggal', 'Berat (kg)', 'Tinggi (cm)', 'BMI', 'Target', 'Kategori', 'Selisih'];
        const rows = filteredData.map((item, index) => {
            const heightInM = item.height / 100;
            const bmi = (item.weight / (heightInM * heightInM)).toFixed(1);
            const difference = item.target_weight ? (item.weight - item.target_weight).toFixed(1) : '';
            
            return [
                index + 1,
                item.full_name,
                formatDate(item.measure_date),
                item.weight,
                item.height,
                bmi,
                item.target_weight || '',
                getCategoryLabel(item.category),
                difference
            ];
        });

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `data_berat_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Helper functions
    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    function showNoData() {
        dataTableBody.innerHTML = '';
        noDataDiv.style.display = 'block';
        document.getElementById('showingFrom').textContent = '0';
        document.getElementById('showingTo').textContent = '0';
        document.getElementById('totalRecords').textContent = '0';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }

    function getCategoryLabel(category) {
        const labels = {
            'diet': 'Diet',
            'bulking': 'Bulking',
            'maintain': 'Maintain',
            'medical': 'Medical',
            'general': 'General'
        };
        return labels[category] || 'General';
    }

    // Global functions for actions
    window.editEntry = function(id) {
        // Redirect to edit page or show modal
        console.log('Edit entry:', id);
        // You can implement edit functionality here
    };

    window.deleteEntry = async function(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
        
        try {
            const response = await fetch(`/api/entries/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Reload data
                loadData();
                alert('Data berhasil dihapus');
            } else {
                alert('Gagal menghapus data');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Terjadi kesalahan');
        }
    };

    window.showImageModal = function(imageUrl) {
        // You can implement a modal to show full size image
        window.open(imageUrl, '_blank');
    };
});