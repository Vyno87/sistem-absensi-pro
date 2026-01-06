const mongoose = require('mongoose');

const LateAlertSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        ref: 'Employee'
    },
    employeeName: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    expectedTime: {
        type: String, // e.g., "09:00"
        required: true
    },
    alertTime: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'dismissed', 'resolved'],
        default: 'active'
    },
    dismissedBy: String,
    dismissedAt: Date
}, {
    timestamps: true
});

// Auto-delete alerts older than 7 days
LateAlertSchema.index({ alertTime: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('LateAlert', LateAlertSchema);
