const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        ref: 'Employee'
    },
    period: {
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },
        year: {
            type: Number,
            required: true
        }
    },
    workingDays: {
        type: Number,
        required: true
    },
    presentDays: {
        type: Number,
        default: 0
    },
    lateDays: {
        type: Number,
        default: 0
    },
    absentDays: {
        type: Number,
        default: 0
    },
    leaveDays: {
        type: Number,
        default: 0
    },
    overtimeHours: {
        type: Number,
        default: 0
    },
    baseSalary: {
        type: Number,
        required: true
    },
    deductions: {
        type: Number,
        default: 0
    },
    bonuses: {
        type: Number,
        default: 0
    },
    netSalary: {
        type: Number,
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String
}, {
    timestamps: true
});

// Compound index for efficient queries
payrollSchema.index({ employeeId: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
