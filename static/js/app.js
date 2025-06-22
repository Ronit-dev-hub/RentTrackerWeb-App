// Property Rent Tracker Application
class RentTracker {
    constructor() {
        this.properties = [];
        this.rentHistory = {};
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        
        this.init();
    }

    async loadData() {
        try {
            // Load properties
            const propertiesResponse = await fetch('/api/properties');
            if (propertiesResponse.ok) {
                this.properties = await propertiesResponse.json();
            }

            // Load rent records
            const recordsResponse = await fetch('/api/rent-records');
            if (recordsResponse.ok) {
                this.rentHistory = await recordsResponse.json();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showErrorMessage('Failed to load data from server');
        }
    }

    async init() {
        this.setupEventListeners();
        this.populateExpectedRentDays();
        
        // Load data from server
        await this.loadData();
        
        this.renderPropertyDashboard();
    }

    setupEventListeners() {
        // Add Property Modal
        document.getElementById('addPropertyBtn').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('addPropertyModal'));
            modal.show();
        });
        document.getElementById('savePropertyBtn').addEventListener('click', () => this.saveProperty());
        
        // Records Modal
        document.getElementById('recordsBtn').addEventListener('click', () => this.showRecordsModal());
        
        // Export functionality
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        
        // Rent Collection Modal
        document.getElementById('saveRentCollectionBtn').addEventListener('click', () => this.saveRentCollection());
    }

    async saveProperty() {
        const name = document.getElementById('propertyName').value.trim();
        const renterName = document.getElementById('renterName').value.trim();
        const address = document.getElementById('propertyAddress').value.trim();
        const renterContact = document.getElementById('renterContact').value.trim();
        const initialRent = parseFloat(document.getElementById('initialRent').value);
        const expectedRentDate = parseInt(document.getElementById('expectedRentDate').value);
        const leaseStartDate = document.getElementById('leaseStartDate').value;
        const yearlyIncreasePercent = parseFloat(document.getElementById('yearlyIncreasePercent').value) || null;
        const yearlyIncreaseAmount = parseFloat(document.getElementById('yearlyIncreaseAmount').value) || null;

        if (!name || !renterName || !address || !initialRent || !expectedRentDate || !leaseStartDate || initialRent <= 0) {
            alert('Please fill in all required fields with valid values.');
            return;
        }

        try {
            const response = await fetch('/api/properties', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    renterName,
                    address,
                    renterContact,
                    initialRent,
                    expectedRentDate,
                    leaseStartDate,
                    yearlyIncreasePercent,
                    yearlyIncreaseAmount
                })
            });

            if (response.ok) {
                const property = await response.json();
                this.properties.push(property);
                
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('addPropertyModal'));
                modal.hide();
                document.getElementById('addPropertyForm').reset();
                
                this.renderPropertyDashboard();
                this.showSuccessMessage('Property added successfully!');
            } else {
                throw new Error('Failed to save property');
            }
        } catch (error) {
            console.error('Error saving property:', error);
            this.showErrorMessage('Failed to save property');
        }
    }

    editProperty(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        document.getElementById('editPropertyId').value = property.id;
        document.getElementById('editPropertyName').value = property.name;
        document.getElementById('editPropertyAddress').value = property.address;
        document.getElementById('editMonthlyRent').value = property.monthlyRent;

        const modal = new bootstrap.Modal(document.getElementById('editPropertyModal'));
        modal.show();
    }

    async updateProperty() {
        const id = document.getElementById('editPropertyId').value;
        const name = document.getElementById('editPropertyName').value.trim();
        const address = document.getElementById('editPropertyAddress').value.trim();
        const rent = parseFloat(document.getElementById('editMonthlyRent').value);

        if (!name || !address || !rent || rent <= 0) {
            alert('Please fill in all fields with valid values.');
            return;
        }

        try {
            const response = await fetch(`/api/properties/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    address,
                    monthlyRent: rent
                })
            });

            if (response.ok) {
                const updatedProperty = await response.json();
                const propertyIndex = this.properties.findIndex(p => p.id === id);
                if (propertyIndex !== -1) {
                    this.properties[propertyIndex] = updatedProperty;
                }
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('editPropertyModal'));
                modal.hide();
                
                this.renderProperties();
                this.renderDashboard();
                this.renderMonthlyTracking();
                this.showSuccessMessage('Property updated successfully!');
            } else {
                throw new Error('Failed to update property');
            }
        } catch (error) {
            console.error('Error updating property:', error);
            this.showErrorMessage('Failed to update property');
        }
    }

    async deleteProperty(propertyId) {
        if (!confirm('Are you sure you want to delete this property? This will also remove all rent tracking history for this property.')) {
            return;
        }

        try {
            const response = await fetch(`/api/properties/${propertyId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.properties = this.properties.filter(p => p.id !== propertyId);
                
                // Clean up rent history for this property
                Object.keys(this.rentHistory).forEach(key => {
                    if (this.rentHistory[key][propertyId]) {
                        delete this.rentHistory[key][propertyId];
                    }
                });
                
                this.renderPropertyDashboard();
                this.showSuccessMessage('Property deleted successfully!');
            } else {
                throw new Error('Failed to delete property');
            }
        } catch (error) {
            console.error('Error deleting property:', error);
            this.showErrorMessage('Failed to delete property');
        }
    }

    async toggleRentStatus(propertyId, month, year) {
        const key = `${year}-${month}`;
        const currentData = this.rentHistory[key] && this.rentHistory[key][propertyId] ? 
            this.rentHistory[key][propertyId] : 
            { received: false, expectedDate: '', receivedDate: '' };

        // Toggle the status
        const newStatus = !currentData.received;
        const newReceivedDate = newStatus ? (currentData.receivedDate || new Date().toISOString().split('T')[0]) : '';

        try {
            const response = await fetch('/api/rent-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    propertyId: parseInt(propertyId),
                    month: month,
                    year: year,
                    expectedDate: currentData.expectedDate,
                    receivedDate: newReceivedDate,
                    received: newStatus
                })
            });

            if (response.ok) {
                const updatedRecord = await response.json();
                
                // Update local data
                if (!this.rentHistory[key]) {
                    this.rentHistory[key] = {};
                }
                this.rentHistory[key][propertyId] = updatedRecord;
                
                this.renderPropertyDashboard();
            } else {
                throw new Error('Failed to update rent status');
            }
        } catch (error) {
            console.error('Error updating rent status:', error);
            this.showErrorMessage('Failed to update rent status');
        }
    }

    async updateRentDates(propertyId, month, year, expectedDate, receivedDate) {
        try {
            const response = await fetch('/api/rent-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    propertyId: parseInt(propertyId),
                    month: month,
                    year: year,
                    expectedDate: expectedDate,
                    receivedDate: receivedDate,
                    received: !!receivedDate
                })
            });

            if (response.ok) {
                const updatedRecord = await response.json();
                
                // Update local data
                const key = `${year}-${month}`;
                if (!this.rentHistory[key]) {
                    this.rentHistory[key] = {};
                }
                this.rentHistory[key][propertyId] = updatedRecord;
                
                this.renderPropertyDashboard();
            } else {
                throw new Error('Failed to update rent record');
            }
        } catch (error) {
            console.error('Error updating rent record:', error);
            this.showErrorMessage('Failed to update rent record');
        }
    }

    showRentDetailsModal(propertyId, month, year) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        const key = `${year}-${month}`;
        const rentData = this.rentHistory[key] && this.rentHistory[key][propertyId] ? 
            this.rentHistory[key][propertyId] : 
            { received: false, expectedDate: '', receivedDate: '' };

        const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });

        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="rentDetailsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Rent Details - ${this.escapeHtml(property.name)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <h6 class="mb-3">${monthName}</h6>
                            <form id="rentDetailsForm" class="rent-details-form">
                                <div class="mb-3">
                                    <label for="expectedDate" class="form-label">Expected Date</label>
                                    <input type="date" class="form-control" id="expectedDate" value="${rentData.expectedDate}">
                                    <div class="form-text">When you expect to receive the rent payment</div>
                                </div>
                                <div class="mb-3">
                                    <label for="receivedDate" class="form-label">Date Received</label>
                                    <input type="date" class="form-control" id="receivedDate" value="${rentData.receivedDate}">
                                    <div class="form-text">When you actually received the rent payment</div>
                                </div>
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="rentReceived" ${rentData.received ? 'checked' : ''}>
                                        <label class="form-check-label" for="rentReceived">
                                            Rent has been received
                                        </label>
                                    </div>
                                </div>
                                <div class="alert alert-info">
                                    <strong>Monthly Rent Amount:</strong> $${property.monthlyRent.toFixed(2)}
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveRentDetailsBtn">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('rentDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('rentDetailsModal'));
        modal.show();

        // Add event listener for save button
        document.getElementById('saveRentDetailsBtn').addEventListener('click', () => {
            const expectedDate = document.getElementById('expectedDate').value;
            const receivedDate = document.getElementById('receivedDate').value;
            const isReceived = document.getElementById('rentReceived').checked;

            // If checkbox is checked but no received date, set to today
            const finalReceivedDate = isReceived ? (receivedDate || new Date().toISOString().split('T')[0]) : '';

            this.updateRentDates(propertyId, month, year, expectedDate, finalReceivedDate);
            modal.hide();
            this.showSuccessMessage('Rent details updated successfully!');
        });

        // Sync checkbox with received date
        document.getElementById('receivedDate').addEventListener('change', (e) => {
            const checkbox = document.getElementById('rentReceived');
            checkbox.checked = !!e.target.value;
        });

        document.getElementById('rentReceived').addEventListener('change', (e) => {
            const receivedDateInput = document.getElementById('receivedDate');
            if (e.target.checked && !receivedDateInput.value) {
                receivedDateInput.value = new Date().toISOString().split('T')[0];
            } else if (!e.target.checked) {
                receivedDateInput.value = '';
            }
        });
    }

    renderDashboard() {
        // Update summary cards
        document.getElementById('totalProperties').textContent = this.properties.length;
        
        const totalExpected = this.properties.reduce((sum, prop) => sum + prop.monthlyRent, 0);
        document.getElementById('totalExpected').textContent = `$${totalExpected.toFixed(2)}`;

        // Current month stats
        const currentKey = `${this.currentYear}-${this.currentMonth}`;
        const currentMonthData = this.rentHistory[currentKey] || {};
        
        let collected = 0;
        let pending = 0;

        this.properties.forEach(property => {
            const rentData = currentMonthData[property.id];
            if (rentData && rentData.received) {
                collected += property.monthlyRent;
            } else {
                pending += property.monthlyRent;
            }
        });

        document.getElementById('currentMonthCollected').textContent = `$${collected.toFixed(2)}`;
        document.getElementById('currentMonthPending').textContent = `$${pending.toFixed(2)}`;
        
        const collectionRate = totalExpected > 0 ? (collected / totalExpected * 100) : 0;
        document.getElementById('collectionRate').textContent = `${collectionRate.toFixed(1)}%`;

        // Recent activity
        this.renderRecentActivity();
    }

    renderRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        const activities = [];

        // Get recent property additions
        const recentProperties = this.properties
            .filter(p => p.createdAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        recentProperties.forEach(property => {
            const date = new Date(property.createdAt);
            activities.push({
                type: 'property_added',
                message: `Added property: ${property.name}`,
                date: date,
                icon: 'fas fa-plus-circle text-success'
            });
        });

        // Get recent rent payments (current month)
        const currentKey = `${this.currentYear}-${this.currentMonth}`;
        const currentMonthData = this.rentHistory[currentKey] || {};
        
        Object.keys(currentMonthData).forEach(propertyId => {
            const property = this.properties.find(p => p.id === propertyId);
            const rentData = currentMonthData[propertyId];
            if (property && rentData && rentData.received) {
                const activityDate = rentData.receivedDate ? new Date(rentData.receivedDate) : new Date();
                activities.push({
                    type: 'rent_received',
                    message: `Rent received from ${property.name}`,
                    date: activityDate,
                    icon: 'fas fa-check-circle text-success'
                });
            }
        });

        // Sort by date and take top 5
        activities.sort((a, b) => b.date - a.date);
        const recentActivities = activities.slice(0, 5);

        if (recentActivities.length === 0) {
            activityContainer.innerHTML = '<p class="text-muted">No recent activity</p>';
            return;
        }

        const activityHTML = recentActivities.map(activity => `
            <div class="d-flex align-items-center mb-2">
                <i class="${activity.icon} me-3"></i>
                <div>
                    <div>${activity.message}</div>
                    <small class="text-muted">${this.formatRelativeDate(activity.date)}</small>
                </div>
            </div>
        `).join('');

        activityContainer.innerHTML = activityHTML;
    }

    renderProperties() {
        const container = document.getElementById('propertiesList');
        
        if (this.properties.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-home fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No properties added yet</h5>
                    <p class="text-muted">Click "Add Property" to get started</p>
                </div>
            `;
            return;
        }

        const propertiesHTML = this.properties.map(property => {
            const currentKey = `${this.currentYear}-${this.currentMonth}`;
            const rentData = this.rentHistory[currentKey] && this.rentHistory[currentKey][property.id];
            const isRentReceived = rentData && rentData.received;
            
            return `
                <div class="card property-card mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h5 class="card-title mb-1">${this.escapeHtml(property.name)}</h5>
                                <p class="text-muted mb-1">${this.escapeHtml(property.address)}</p>
                                <p class="mb-0">
                                    <strong>Monthly Rent: $${property.monthlyRent.toFixed(2)}</strong>
                                </p>
                                ${rentData && rentData.expectedDate ? `<small class="text-muted">Expected: ${rentData.expectedDate}</small><br>` : ''}
                                ${rentData && rentData.receivedDate ? `<small class="text-success">Received: ${rentData.receivedDate}</small>` : ''}
                            </div>
                            <div class="col-md-4 text-md-end">
                                <div class="mb-2">
                                    <span class="badge rent-status-badge ${isRentReceived ? 'bg-success' : 'bg-warning text-dark'}">
                                        ${isRentReceived ? 'Rent Received' : 'Rent Pending'}
                                    </span>
                                </div>
                                <div class="btn-group-vertical btn-group-sm">
                                    <button class="btn btn-outline-info btn-sm" onclick="rentTracker.showRentDetailsModal('${property.id}', ${this.currentMonth}, ${this.currentYear})">
                                        <i class="fas fa-calendar-alt me-1"></i>Rent Details
                                    </button>
                                    <button class="btn btn-outline-primary btn-sm" onclick="rentTracker.editProperty('${property.id}')">
                                        <i class="fas fa-edit me-1"></i>Edit
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="rentTracker.deleteProperty('${property.id}')">
                                        <i class="fas fa-trash me-1"></i>Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = propertiesHTML;
    }

    renderMonthlyTracking() {
        const selectedMonth = parseInt(document.getElementById('monthSelect').value);
        const selectedYear = parseInt(document.getElementById('yearSelect').value);
        const container = document.getElementById('monthlyTrackingContent');

        if (this.properties.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No properties to track</h5>
                    <p class="text-muted">Add some properties first to start tracking rent</p>
                </div>
            `;
            return;
        }

        const key = `${selectedYear}-${selectedMonth}`;
        const monthData = this.rentHistory[key] || {};
        
        let totalCollected = 0;
        let totalExpected = 0;

        const trackingHTML = this.properties.map(property => {
            const rentData = monthData[property.id] || { received: false, expectedDate: '', receivedDate: '' };
            const isReceived = rentData.received;
            if (isReceived) totalCollected += property.monthlyRent;
            totalExpected += property.monthlyRent;

            return `
                <div class="card tracking-card mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h6 class="mb-1">${this.escapeHtml(property.name)}</h6>
                                <p class="text-muted mb-1">${this.escapeHtml(property.address)}</p>
                                <p class="mb-1"><strong>$${property.monthlyRent.toFixed(2)}</strong></p>
                                <div class="date-info">
                                    ${rentData.expectedDate ? `<small class="text-muted d-block">Expected: ${rentData.expectedDate}</small>` : ''}
                                    ${rentData.receivedDate ? `<small class="text-success d-block">Received: ${rentData.receivedDate}</small>` : ''}
                                </div>
                            </div>
                            <div class="col-md-6 text-md-end">
                                <div class="tracking-actions">
                                    <button 
                                        class="btn rent-toggle ${isReceived ? 'btn-received' : 'btn-pending'}"
                                        data-property="${property.id}"
                                        data-month="${selectedMonth}"
                                        data-year="${selectedYear}"
                                        onclick="rentTracker.toggleRentStatus('${property.id}', ${selectedMonth}, ${selectedYear})"
                                    >
                                        <i class="fas ${isReceived ? 'fa-check-circle' : 'fa-clock'} me-2"></i>
                                        ${isReceived ? 'Received' : 'Pending'}
                                    </button>
                                    <button 
                                        class="btn btn-outline-info btn-sm"
                                        onclick="rentTracker.showRentDetailsModal('${property.id}', ${selectedMonth}, ${selectedYear})"
                                    >
                                        <i class="fas fa-calendar-edit me-1"></i>Manage Dates
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const monthName = new Date(selectedYear, selectedMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected * 100) : 0;

        const summaryHTML = `
            <div class="card mb-4 stats-card">
                <div class="card-body">
                    <h5 class="card-title text-white mb-3">
                        <i class="fas fa-chart-pie me-2"></i>${monthName} Summary
                    </h5>
                    <div class="row text-center">
                        <div class="col-md-3">
                            <h6 class="text-white-50">Collected</h6>
                            <h4 class="text-white">$${totalCollected.toFixed(2)}</h4>
                        </div>
                        <div class="col-md-3">
                            <h6 class="text-white-50">Pending</h6>
                            <h4 class="text-white">$${(totalExpected - totalCollected).toFixed(2)}</h4>
                        </div>
                        <div class="col-md-3">
                            <h6 class="text-white-50">Expected</h6>
                            <h4 class="text-white">$${totalExpected.toFixed(2)}</h4>
                        </div>
                        <div class="col-md-3">
                            <h6 class="text-white-50">Rate</h6>
                            <h4 class="text-white">${collectionRate.toFixed(1)}%</h4>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = summaryHTML + trackingHTML;
    }

    populateMonthYearSelectors() {
        const monthSelect = document.getElementById('monthSelect');
        const yearSelect = document.getElementById('yearSelect');

        // Populate months
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        monthSelect.innerHTML = months.map((month, index) => 
            `<option value="${index}">${month}</option>`
        ).join('');

        // Populate years (current year - 2 to current year + 1)
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear - 2; year <= currentYear + 1; year++) {
            years.push(year);
        }

        yearSelect.innerHTML = years.map(year => 
            `<option value="${year}">${year}</option>`
        ).join('');
    }

    exportData() {
        const data = {
            properties: this.properties,
            rentHistory: this.rentHistory,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `rent-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showSuccessMessage('Data exported successfully!');
    }

    populateExpectedRentDays() {
        const expectedRentDateSelect = document.getElementById('expectedRentDate');
        if (!expectedRentDateSelect) return;
        
        expectedRentDateSelect.innerHTML = '<option value="">Select day of month</option>';
        
        for (let day = 1; day <= 31; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = `${day}${this.getOrdinalSuffix(day)}`;
            expectedRentDateSelect.appendChild(option);
        }
    }

    getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    renderPropertyDashboard() {
        const propertyGrid = document.getElementById('propertyGrid');
        
        if (this.properties.length === 0) {
            propertyGrid.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-home"></i>
                        <h4>No Properties Added Yet</h4>
                        <p>Click "Add Property" to get started with tracking your rental properties.</p>
                    </div>
                </div>
            `;
            return;
        }

        const currentKey = `${this.currentYear}-${this.currentMonth}`;
        const currentMonthData = this.rentHistory[currentKey] || {};

        const propertyCards = this.properties.map(property => {
            const rentData = currentMonthData[property.id];
            const isRentReceived = rentData && rentData.received;
            const rentStatusClass = isRentReceived ? 'rent-received' : 'rent-pending';
            const rentAmountClass = isRentReceived ? 'received' : 'pending';
            
            return `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                    <div class="card property-card ${rentStatusClass}" onclick="rentTracker.openRentCollection('${property.id}')">
                        <div class="card-body p-3">
                            <div class="property-name">${this.escapeHtml(property.name)}</div>
                            <div class="renter-name">${this.escapeHtml(property.renterName)}</div>
                            <div class="rent-amount ${rentAmountClass}">$${property.currentRent.toFixed(2)}</div>
                            <div class="property-status">
                                ${isRentReceived ? 'Rent Received' : 'Rent Pending'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        propertyGrid.innerHTML = propertyCards;
    }

    openRentCollection(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        const currentKey = `${this.currentYear}-${this.currentMonth}`;
        const rentData = this.rentHistory[currentKey] && this.rentHistory[currentKey][propertyId];
        
        if (rentData && rentData.received) {
            this.showRentDetails(property, rentData);
            return;
        }

        document.getElementById('collectionPropertyId').value = propertyId;
        document.getElementById('collectionMonth').value = this.currentMonth;
        document.getElementById('collectionYear').value = this.currentYear;
        document.getElementById('rentCollectionTitle').textContent = `Record Rent Payment - ${property.name}`;
        document.getElementById('rentAmountInfo').innerHTML = `
            <strong>Rent Amount:</strong> $${property.currentRent.toFixed(2)}<br>
            <strong>Renter:</strong> ${property.renterName}<br>
            <strong>Expected Date:</strong> ${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(property.expectedRentDate).padStart(2, '0')}
        `;
        
        document.getElementById('receivedDate').value = new Date().toISOString().split('T')[0];
        
        const modal = new bootstrap.Modal(document.getElementById('rentCollectionModal'));
        modal.show();
    }

    showRentDetails(property, rentData) {
        const monthName = new Date(this.currentYear, this.currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        
        const detailsHTML = `
            <div class="alert alert-success">
                <h5><i class="fas fa-check-circle me-2"></i>Rent Received</h5>
                <p><strong>Property:</strong> ${property.name}</p>
                <p><strong>Renter:</strong> ${property.renterName}</p>
                <p><strong>Month:</strong> ${monthName}</p>
                <p><strong>Amount:</strong> $${property.currentRent.toFixed(2)}</p>
                <p><strong>Received Date:</strong> ${rentData.receivedDate}</p>
                ${rentData.paymentMode ? `<p><strong>Payment Mode:</strong> ${rentData.paymentMode}</p>` : ''}
            </div>
        `;
        
        const existingModal = document.getElementById('rentDetailsViewModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="rentDetailsViewModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Rent Payment Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${detailsHTML}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('rentDetailsViewModal'));
        modal.show();
    }

    async saveRentCollection() {
        const propertyId = document.getElementById('collectionPropertyId').value;
        const month = parseInt(document.getElementById('collectionMonth').value);
        const year = parseInt(document.getElementById('collectionYear').value);
        const receivedDate = document.getElementById('receivedDate').value;
        const paymentMode = document.getElementById('paymentMode').value;

        if (!receivedDate) {
            alert('Please select the date when rent was received.');
            return;
        }

        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        try {
            const response = await fetch('/api/rent-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    propertyId: parseInt(propertyId),
                    month: month,
                    year: year,
                    receivedDate: receivedDate,
                    paymentMode: paymentMode,
                    received: true,
                    rentAmount: property.currentRent
                })
            });

            if (response.ok) {
                const updatedRecord = await response.json();
                
                const key = `${year}-${month}`;
                if (!this.rentHistory[key]) {
                    this.rentHistory[key] = {};
                }
                this.rentHistory[key][propertyId] = updatedRecord;
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('rentCollectionModal'));
                modal.hide();
                document.getElementById('rentCollectionForm').reset();
                
                this.renderPropertyDashboard();
                this.showSuccessMessage('Rent payment recorded successfully!');
            } else {
                throw new Error('Failed to record rent payment');
            }
        } catch (error) {
            console.error('Error recording rent payment:', error);
            this.showErrorMessage('Failed to record rent payment');
        }
    }

    async showRecordsModal() {
        const modal = new bootstrap.Modal(document.getElementById('recordsModal'));
        modal.show();
        await this.loadRecords();
    }

    async loadRecords() {
        try {
            const recordsResponse = await fetch('/api/rent-records');
            if (recordsResponse.ok) {
                const records = await recordsResponse.json();
                this.displayRecords(records);
            }
        } catch (error) {
            console.error('Error loading records:', error);
            this.showErrorMessage('Failed to load records');
        }
    }

    displayRecords(records) {
        const recordsContent = document.getElementById('recordsContent');
        const flatRecords = [];
        
        Object.keys(records).forEach(key => {
            const [year, month] = key.split('-').map(Number);
            const monthData = records[key];
            
            Object.keys(monthData).forEach(propertyId => {
                const property = this.properties.find(p => p.id === propertyId);
                if (property) {
                    const record = monthData[propertyId];
                    flatRecords.push({
                        property: property,
                        year: year,
                        month: month,
                        ...record
                    });
                }
            });
        });

        flatRecords.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            if (a.month !== b.month) return b.month - a.month;
            return a.property.name.localeCompare(b.property.name);
        });

        if (flatRecords.length === 0) {
            recordsContent.innerHTML = '<p class="text-muted text-center">No rent records found.</p>';
            return;
        }

        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped records-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Renter</th>
                            <th>Month</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Received Date</th>
                            <th>Payment Mode</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${flatRecords.map(record => {
                            const monthName = new Date(record.year, record.month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                            const statusClass = record.received ? 'status-received' : 'status-pending';
                            
                            return `
                                <tr>
                                    <td>${this.escapeHtml(record.property.name)}</td>
                                    <td>${this.escapeHtml(record.property.renterName)}</td>
                                    <td>${monthName}</td>
                                    <td>$${(record.rentAmount || record.property.currentRent).toFixed(2)}</td>
                                    <td class="${statusClass}">${record.received ? 'Received' : 'Pending'}</td>
                                    <td>${record.receivedDate || '-'}</td>
                                    <td>${record.paymentMode || '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        recordsContent.innerHTML = tableHTML;
    }

    async exportData() {
        try {
            const response = await fetch('/api/export/excel');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `property_rent_data_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                this.showSuccessMessage('Data exported successfully!');
            } else {
                throw new Error('Failed to export data');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showErrorMessage('Failed to export data');
        }
    }



    // Utility methods
    showErrorMessage(message) {
        let errorElement = document.getElementById('errorMessage');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'errorMessage';
            errorElement.className = 'alert alert-danger alert-dismissible fade show position-fixed';
            errorElement.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
            document.body.appendChild(errorElement);
        }
        
        errorElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        setTimeout(() => {
            if (errorElement && errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatRelativeDate(date) {
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }

    showSuccessMessage(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'position-fixed top-0 end-0 p-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.rentTracker = new RentTracker();
});
