/**
 * Generates a consistent device fingerprint based on browser and hardware details.
 */
export const getDeviceFingerprint = (): string => {
    const navigator = window.navigator;
    const screen = window.screen;

    const data = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform,
        // Add canvas fingerprint for better uniqueness
        getCanvasFingerprint()
    ].join('|');

    // Simple hash function (hashCode style)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return 'DFP-' + Math.abs(hash).toString(36).toUpperCase();
};

const getCanvasFingerprint = (): string => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no-canvas';

        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("SistemAbsensiPro-2026", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("SistemAbsensiPro-2026", 4, 17);

        return canvas.toDataURL();
    } catch (e) {
        return 'error';
    }
};
