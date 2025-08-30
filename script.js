// Employee Management System - JavaScript Logic

class EmployeeManagementSystem {
    constructor() {
        this.employees = this.loadFromStorage('employees') || [];
        this.appreciationLetters = this.loadFromStorage('appreciationLetters') || [];
        this.penalties = this.loadFromStorage('penalties') || [];
        this.currentEditingEmployee = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showSection('dashboard');
        this.updateDashboard();
        this.renderEmployeesTable();
        this.renderAppreciationTable();
        this.renderPenaltiesTable();
        this.populateEmployeeSelects();
        
        // Add sample data if no data exists
        if (this.employees.length === 0) {
            this.addSampleData();
        }
    }

    // Local Storage Methods
    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('ar-SA');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR'
        }).format(amount);
    }

    // Date Calculation Methods
    addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    calculateTotalAdvancedMonths(employeeId) {
        return this.appreciationLetters
            .filter(letter => letter.employeeId === employeeId)
            .reduce((total, letter) => total + parseInt(letter.monthsAdvanced), 0);
    }

    calculateTotalDelayedMonths(employeeId) {
        return this.penalties
            .filter(penalty => penalty.employeeId === employeeId)
            .reduce((total, penalty) => total + parseInt(penalty.monthsDelayed), 0);
    }

    calculateNextBonusDate(employee) {
        if (!employee.lastBonusDate) return null;
        
        // Base date: last bonus + 12 months
        let baseDate = this.addMonths(new Date(employee.lastBonusDate), 12);
        
        // Calculate adjustments
        const totalAdvanced = this.calculateTotalAdvancedMonths(employee.id);
        const totalDelayed = this.calculateTotalDelayedMonths(employee.id);
        
        // Apply adjustments
        const finalDate = this.addMonths(baseDate, -totalAdvanced + totalDelayed);
        
        return finalDate;
    }

    calculateNextPromotionDate(employee) {
        if (!employee.lastPromotionDate) return null;
        
        // Get promotion period based on job grade (simplified logic)
        const promotionPeriods = {
            'الدرجة الأولى': 60, // 5 years
            'الدرجة الثانية': 48, // 4 years
            'الدرجة الثالثة': 36, // 3 years
            'الدرجة الرابعة': 24  // 2 years
        };
        
        const promotionPeriod = promotionPeriods[employee.jobGrade] || 36;
        let baseDate = this.addMonths(new Date(employee.lastPromotionDate), promotionPeriod);
        
        // Apply same adjustments as bonuses (simplified)
        const totalAdvanced = this.calculateTotalAdvancedMonths(employee.id);
        const totalDelayed = this.calculateTotalDelayedMonths(employee.id);
        
        const finalDate = this.addMonths(baseDate, -totalAdvanced + totalDelayed);
        
        return finalDate;
    }

    getBonusStatus(nextBonusDate) {
        if (!nextBonusDate) return { status: 'غير محدد', class: 'future', color: 'gray' };
        
        const today = new Date();
        const diffTime = nextBonusDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) {
            return { status: 'مستحق', class: 'overdue', color: 'red' };
        } else if (diffDays <= 30) {
            return { status: 'قريباً', class: 'upcoming', color: 'yellow' };
        } else {
            return { status: 'غير مستحق', class: 'future', color: 'green' };
        }
    }

    getPromotionStatus(nextPromotionDate) {
        return this.getBonusStatus(nextPromotionDate); // Same logic for now
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.nav-btn').dataset.section;
                this.showSection(section);
            });
        });

        // Employee Management
        document.getElementById('add-employee-btn').addEventListener('click', () => {
            this.showEmployeeModal();
        });

        document.getElementById('employee-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEmployee();
        });

        document.getElementById('employee-cancel-btn').addEventListener('click', () => {
            this.hideEmployeeModal();
        });

        document.getElementById('employee-modal-close').addEventListener('click', () => {
            this.hideEmployeeModal();
        });

        // Appreciation Letters
        document.getElementById('add-appreciation-btn').addEventListener('click', () => {
            this.showAppreciationModal();
        });

        document.getElementById('appreciation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAppreciationLetter();
        });

        document.getElementById('appreciation-cancel-btn').addEventListener('click', () => {
            this.hideAppreciationModal();
        });

        document.getElementById('appreciation-modal-close').addEventListener('click', () => {
            this.hideAppreciationModal();
        });

        // Penalties
        document.getElementById('add-penalty-btn').addEventListener('click', () => {
            this.showPenaltyModal();
        });

        document.getElementById('penalty-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePenalty();
        });

        document.getElementById('penalty-cancel-btn').addEventListener('click', () => {
            this.hidePenaltyModal();
        });

        document.getElementById('penalty-modal-close').addEventListener('click', () => {
            this.hidePenaltyModal();
        });

        // Search and Filter
        document.getElementById('employee-search').addEventListener('input', (e) => {
            this.filterEmployees(e.target.value);
        });

        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filterEmployeesByStatus(e.target.value);
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    // Navigation Methods
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content based on section
        if (sectionName === 'dashboard') {
            this.updateDashboard();
        }
    }

    // Dashboard Methods
    updateDashboard() {
        const stats = this.calculateStatistics();
        
        document.getElementById('overdue-bonuses').textContent = stats.overdueBonuses;
        document.getElementById('upcoming-bonuses').textContent = stats.upcomingBonuses;
        document.getElementById('due-promotions').textContent = stats.duePromotions;
        document.getElementById('total-employees').textContent = stats.totalEmployees;

        this.renderAlerts();
        this.renderRecentActivity();
    }

    calculateStatistics() {
        let overdueBonuses = 0;
        let upcomingBonuses = 0;
        let duePromotions = 0;

        this.employees.forEach(employee => {
            const nextBonusDate = this.calculateNextBonusDate(employee);
            const bonusStatus = this.getBonusStatus(nextBonusDate);
            
            if (bonusStatus.class === 'overdue') overdueBonuses++;
            if (bonusStatus.class === 'upcoming') upcomingBonuses++;

            const nextPromotionDate = this.calculateNextPromotionDate(employee);
            const promotionStatus = this.getPromotionStatus(nextPromotionDate);
            
            if (promotionStatus.class === 'overdue') duePromotions++;
        });

        return {
            overdueBonuses,
            upcomingBonuses,
            duePromotions,
            totalEmployees: this.employees.length
        };
    }

    renderAlerts() {
        const alertsContainer = document.getElementById('alerts-container');
        alertsContainer.innerHTML = '';

        const alerts = [];

        this.employees.forEach(employee => {
            const nextBonusDate = this.calculateNextBonusDate(employee);
            const bonusStatus = this.getBonusStatus(nextBonusDate);
            
            if (bonusStatus.class === 'overdue') {
                alerts.push({
                    type: 'overdue',
                    message: `علاوة ${employee.name} مستحقة منذ ${this.formatDate(nextBonusDate)}`,
                    icon: 'fas fa-exclamation-circle'
                });
            } else if (bonusStatus.class === 'upcoming') {
                alerts.push({
                    type: 'upcoming',
                    message: `علاوة ${employee.name} مستحقة في ${this.formatDate(nextBonusDate)}`,
                    icon: 'fas fa-clock'
                });
            }
        });

        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">لا توجد تنبيهات في الوقت الحالي</p>';
            return;
        }

        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert ${alert.type}`;
            alertElement.innerHTML = `
                <i class="${alert.icon}"></i>
                <span>${alert.message}</span>
            `;
            alertsContainer.appendChild(alertElement);
        });
    }

    renderRecentActivity() {
        const activityList = document.getElementById('recent-activity-list');
        activityList.innerHTML = '';

        // Combine recent activities
        const activities = [];

        // Recent appreciation letters
        this.appreciationLetters.slice(-5).forEach(letter => {
            const employee = this.employees.find(emp => emp.id === letter.employeeId);
            if (employee) {
                activities.push({
                    message: `تم إضافة خطاب شكر لـ ${employee.name}`,
                    date: new Date(letter.date),
                    type: 'appreciation'
                });
            }
        });

        // Recent penalties
        this.penalties.slice(-5).forEach(penalty => {
            const employee = this.employees.find(emp => emp.id === penalty.employeeId);
            if (employee) {
                activities.push({
                    message: `تم إضافة عقوبة لـ ${employee.name}`,
                    date: new Date(penalty.date),
                    type: 'penalty'
                });
            }
        });

        // Sort by date
        activities.sort((a, b) => b.date - a.date);

        if (activities.length === 0) {
            activityList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">لا يوجد نشاط حديث</p>';
            return;
        }

        activities.slice(0, 5).forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            activityElement.innerHTML = `
                <div class="activity-content">
                    <p>${activity.message}</p>
                </div>
                <div class="activity-time">
                    ${this.formatDate(activity.date)}
                </div>
            `;
            activityList.appendChild(activityElement);
        });
    }

    // Employee Management Methods
    showEmployeeModal(employee = null) {
        this.currentEditingEmployee = employee;
        const modal = document.getElementById('employee-modal');
        const form = document.getElementById('employee-form');
        const title = document.getElementById('employee-modal-title');

        if (employee) {
            title.textContent = 'تعديل بيانات الموظف';
            this.populateEmployeeForm(employee);
        } else {
            title.textContent = 'إضافة موظف جديد';
            form.reset();
        }

        modal.classList.add('active');
    }

    hideEmployeeModal() {
        document.getElementById('employee-modal').classList.remove('active');
        this.currentEditingEmployee = null;
    }

    populateEmployeeForm(employee) {
        document.getElementById('employee-name').value = employee.name;
        document.getElementById('employee-salary').value = employee.basicSalary;
        document.getElementById('employee-grade').value = employee.jobGrade;
        document.getElementById('employee-education').value = employee.education;
        document.getElementById('employee-last-bonus').value = employee.lastBonusDate;
        document.getElementById('employee-last-promotion').value = employee.lastPromotionDate;
        document.getElementById('employee-department').value = employee.department;
    }

    saveEmployee() {
        const formData = new FormData(document.getElementById('employee-form'));
        const employeeData = {
            name: formData.get('name'),
            basicSalary: parseFloat(formData.get('basicSalary')),
            jobGrade: formData.get('jobGrade'),
            education: formData.get('education'),
            lastBonusDate: formData.get('lastBonusDate'),
            lastPromotionDate: formData.get('lastPromotionDate'),
            department: formData.get('department')
        };

        if (this.currentEditingEmployee) {
            // Update existing employee
            const index = this.employees.findIndex(emp => emp.id === this.currentEditingEmployee.id);
            this.employees[index] = { ...this.currentEditingEmployee, ...employeeData };
            this.showToast('تم تحديث بيانات الموظف بنجاح', 'success');
        } else {
            // Add new employee
            const newEmployee = {
                id: this.generateId(),
                ...employeeData
            };
            this.employees.push(newEmployee);
            this.showToast('تم إضافة الموظف بنجاح', 'success');
        }

        this.saveToStorage('employees', this.employees);
        this.renderEmployeesTable();
        this.populateEmployeeSelects();
        this.updateDashboard();
        this.hideEmployeeModal();
    }

    deleteEmployee(employeeId) {
        if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
            this.employees = this.employees.filter(emp => emp.id !== employeeId);
            
            // Also remove related appreciation letters and penalties
            this.appreciationLetters = this.appreciationLetters.filter(letter => letter.employeeId !== employeeId);
            this.penalties = this.penalties.filter(penalty => penalty.employeeId !== employeeId);
            
            this.saveToStorage('employees', this.employees);
            this.saveToStorage('appreciationLetters', this.appreciationLetters);
            this.saveToStorage('penalties', this.penalties);
            
            this.renderEmployeesTable();
            this.renderAppreciationTable();
            this.renderPenaltiesTable();
            this.populateEmployeeSelects();
            this.updateDashboard();
            
            this.showToast('تم حذف الموظف بنجاح', 'success');
        }
    }

    renderEmployeesTable() {
        const tbody = document.getElementById('employees-table-body');
        tbody.innerHTML = '';

        this.employees.forEach(employee => {
            const nextBonusDate = this.calculateNextBonusDate(employee);
            const bonusStatus = this.getBonusStatus(nextBonusDate);
            
            const nextPromotionDate = this.calculateNextPromotionDate(employee);
            const promotionStatus = this.getPromotionStatus(nextPromotionDate);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${this.formatCurrency(employee.basicSalary)}</td>
                <td>${employee.jobGrade}</td>
                <td>${this.formatDate(employee.lastBonusDate)}</td>
                <td>${nextBonusDate ? this.formatDate(nextBonusDate) : 'غير محدد'}</td>
                <td><span class="status-badge status-${bonusStatus.class}">${bonusStatus.status}</span></td>
                <td><span class="status-badge status-${promotionStatus.class}">${promotionStatus.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="app.showEmployeeModal(app.employees.find(emp => emp.id === '${employee.id}'))" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="app.deleteEmployee('${employee.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    filterEmployees(searchTerm) {
        const rows = document.querySelectorAll('#employees-table-body tr');
        rows.forEach(row => {
            const employeeName = row.cells[0].textContent.toLowerCase();
            if (employeeName.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    filterEmployeesByStatus(status) {
        const rows = document.querySelectorAll('#employees-table-body tr');
        rows.forEach(row => {
            if (!status) {
                row.style.display = '';
                return;
            }
            
            const statusBadge = row.cells[5].querySelector('.status-badge');
            if (statusBadge.classList.contains(`status-${status}`)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Appreciation Letters Methods
    showAppreciationModal() {
        const modal = document.getElementById('appreciation-modal');
        const form = document.getElementById('appreciation-form');
        form.reset();
        modal.classList.add('active');
    }

    hideAppreciationModal() {
        document.getElementById('appreciation-modal').classList.remove('active');
    }

    saveAppreciationLetter() {
        const formData = new FormData(document.getElementById('appreciation-form'));
        const letterData = {
            id: this.generateId(),
            employeeId: formData.get('employeeId'),
            date: formData.get('date'),
            reason: formData.get('reason'),
            monthsAdvanced: parseInt(formData.get('monthsAdvanced'))
        };

        this.appreciationLetters.push(letterData);
        this.saveToStorage('appreciationLetters', this.appreciationLetters);
        
        this.renderAppreciationTable();
        this.renderEmployeesTable(); // Update employee table to reflect changes
        this.updateDashboard();
        this.hideAppreciationModal();
        
        this.showToast('تم إضافة خطاب الشكر بنجاح', 'success');
    }

    deleteAppreciationLetter(letterId) {
        if (confirm('هل أنت متأكد من حذف خطاب الشكر؟')) {
            this.appreciationLetters = this.appreciationLetters.filter(letter => letter.id !== letterId);
            this.saveToStorage('appreciationLetters', this.appreciationLetters);
            
            this.renderAppreciationTable();
            this.renderEmployeesTable();
            this.updateDashboard();
            
            this.showToast('تم حذف خطاب الشكر بنجاح', 'success');
        }
    }

    renderAppreciationTable() {
        const tbody = document.getElementById('appreciation-table-body');
        tbody.innerHTML = '';

        this.appreciationLetters.forEach(letter => {
            const employee = this.employees.find(emp => emp.id === letter.employeeId);
            if (!employee) return;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${this.formatDate(letter.date)}</td>
                <td>${letter.reason}</td>
                <td>${letter.monthsAdvanced} شهر</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn delete" onclick="app.deleteAppreciationLetter('${letter.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Penalties Methods
    showPenaltyModal() {
        const modal = document.getElementById('penalty-modal');
        const form = document.getElementById('penalty-form');
        form.reset();
        modal.classList.add('active');
    }

    hidePenaltyModal() {
        document.getElementById('penalty-modal').classList.remove('active');
    }

    savePenalty() {
        const formData = new FormData(document.getElementById('penalty-form'));
        const penaltyData = {
            id: this.generateId(),
            employeeId: formData.get('employeeId'),
            date: formData.get('date'),
            type: formData.get('type'),
            monthsDelayed: parseInt(formData.get('monthsDelayed')),
            reason: formData.get('reason')
        };

        this.penalties.push(penaltyData);
        this.saveToStorage('penalties', this.penalties);
        
        this.renderPenaltiesTable();
        this.renderEmployeesTable();
        this.updateDashboard();
        this.hidePenaltyModal();
        
        this.showToast('تم إضافة العقوبة بنجاح', 'success');
    }

    deletePenalty(penaltyId) {
        if (confirm('هل أنت متأكد من حذف العقوبة؟')) {
            this.penalties = this.penalties.filter(penalty => penalty.id !== penaltyId);
            this.saveToStorage('penalties', this.penalties);
            
            this.renderPenaltiesTable();
            this.renderEmployeesTable();
            this.updateDashboard();
            
            this.showToast('تم حذف العقوبة بنجاح', 'success');
        }
    }

    renderPenaltiesTable() {
        const tbody = document.getElementById('penalties-table-body');
        tbody.innerHTML = '';

        this.penalties.forEach(penalty => {
            const employee = this.employees.find(emp => emp.id === penalty.employeeId);
            if (!employee) return;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${this.formatDate(penalty.date)}</td>
                <td>${penalty.type}</td>
                <td>${penalty.monthsDelayed} شهر</td>
                <td>${penalty.reason}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn delete" onclick="app.deletePenalty('${penalty.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Utility Methods
    populateEmployeeSelects() {
        const appreciationSelect = document.getElementById('appreciation-employee');
        const penaltySelect = document.getElementById('penalty-employee');
        
        // Clear existing options
        appreciationSelect.innerHTML = '<option value="">اختر الموظف</option>';
        penaltySelect.innerHTML = '<option value="">اختر الموظف</option>';
        
        // Add employee options
        this.employees.forEach(employee => {
            const option1 = document.createElement('option');
            option1.value = employee.id;
            option1.textContent = employee.name;
            appreciationSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = employee.id;
            option2.textContent = employee.name;
            penaltySelect.appendChild(option2);
        });
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type];
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // Sample Data
    addSampleData() {
        const sampleEmployees = [
            {
                id: this.generateId(),
                name: 'أحمد محمد علي',
                basicSalary: 8000,
                jobGrade: 'الدرجة الثالثة',
                education: 'بكالوريوس',
                lastBonusDate: '2023-01-15',
                lastPromotionDate: '2021-06-01',
                department: 'الموارد البشرية'
            },
            {
                id: this.generateId(),
                name: 'فاطمة أحمد السالم',
                basicSalary: 9500,
                jobGrade: 'الدرجة الثانية',
                education: 'ماجستير',
                lastBonusDate: '2023-06-10',
                lastPromotionDate: '2020-03-15',
                department: 'المالية'
            },
            {
                id: this.generateId(),
                name: 'محمد عبدالله الخالد',
                basicSalary: 7200,
                jobGrade: 'الدرجة الرابعة',
                education: 'بكالوريوس',
                lastBonusDate: '2022-12-01',
                lastPromotionDate: '2022-01-10',
                department: 'تقنية المعلومات'
            }
        ];

        this.employees = sampleEmployees;
        this.saveToStorage('employees', this.employees);

        // Add sample appreciation letters
        const sampleAppreciation = [
            {
                id: this.generateId(),
                employeeId: sampleEmployees[0].id,
                date: '2023-08-15',
                reason: 'تميز في الأداء الوظيفي',
                monthsAdvanced: 2
            }
        ];

        this.appreciationLetters = sampleAppreciation;
        this.saveToStorage('appreciationLetters', this.appreciationLetters);

        // Add sample penalties
        const samplePenalties = [
            {
                id: this.generateId(),
                employeeId: sampleEmployees[2].id,
                date: '2023-07-20',
                type: 'إنذار',
                monthsDelayed: 1,
                reason: 'تأخير في تسليم المشروع'
            }
        ];

        this.penalties = samplePenalties;
        this.saveToStorage('penalties', this.penalties);

        this.populateEmployeeSelects();
        this.showToast('تم تحميل البيانات التجريبية', 'info');
    }
}

// Initialize the application
const app = new EmployeeManagementSystem();

