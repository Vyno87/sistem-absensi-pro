const mongoose = require('mongoose');

const GeofenceSettingsSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: false
    },
    centerLat: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
        default: -6.2088 // Default Jakarta
    },
    centerLng: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
        default: 106.8456 // Default Jakarta
    },
    radiusMeters: {
        type: Number,
        required: true,
        min: 10,
        max: 5000,
        default: 100
    },
    blockOutOfRange: {
        type: Boolean,
        default: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String,
        default: 'admin'
    }
});

// Singleton pattern - only one settings document
GeofenceSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('GeofenceSettings', GeofenceSettingsSchema);
