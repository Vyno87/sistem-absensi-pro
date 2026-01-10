const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    next();
};

/**
 * @route    GET api/analytics/insights
 * @desc     Get comprehensive AI-powered insights (Late patterns, risk, stars)
 * @access   Private (Admin only)
 */
router.get('/insights', auth, adminOnly, async (req, res) => {
    try {
        const insights = await analyticsService.generateInsights();
        res.json(insights);
    } catch (err) {
        console.error('Error generating insights:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

/**
 * @route    GET api/analytics/employee/:id/prediction
 * @desc     Get specific prediction data for an employee
 * @access   Private (Admin only)
 */
router.get('/employee/:id/prediction', auth, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const [latePattern, absenceRisk, performanceScore] = await Promise.all([
            analyticsService.detectLatePattern(id),
            analyticsService.calculateAbsenceRisk(id),
            analyticsService.calculatePerformanceScore(id)
        ]);

        res.json({
            employeeId: id,
            latePattern,
            absenceRisk,
            performanceScore,
            generatedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error getting employee prediction:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

/**
 * @route    GET api/analytics/promotions
 * @desc     Get promotion recommendations
 * @access   Private (Admin only)
 */
router.get('/promotions', auth, adminOnly, async (req, res) => {
    try {
        const recommendations = await analyticsService.getPromotionRecommendations();
        res.json(recommendations);
    } catch (err) {
        console.error('Error getting promotion recommendations:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

/**
 * @route    GET api/analytics/risk/absence
 * @desc     Get absence risk report for all employees
 * @access   Private (Admin only)
 */
router.get('/risk/absence', auth, adminOnly, async (req, res) => {
    try {
        const Employee = require('../models/Employee');
        const employees = await Employee.find().lean();

        const risks = [];
        for (const emp of employees) {
            const risk = await analyticsService.calculateAbsenceRisk(emp.employeeId);
            risks.push({
                employeeId: emp.employeeId,
                name: emp.name,
                position: emp.position,
                ...risk
            });
        }

        // Sort by risk score (highest first)
        risks.sort((a, b) => b.score - a.score);

        res.json(risks);
    } catch (err) {
        console.error('Error getting absence risks:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

/**
 * @route    POST api/analytics/sync
 * @desc     Sync all employee performance scores and promotion recommendations using AI logic
 * @access   Private (Admin only)
 */
router.post('/sync', auth, adminOnly, async (req, res) => {
    try {
        const Employee = require('../models/Employee');
        const employees = await Employee.find();

        console.log(`[AI SYNC] Starting sync for ${employees.length} employees...`);

        let updatedCount = 0;
        const recommendations = await analyticsService.getPromotionRecommendations();
        const recommendedIds = new Set(recommendations.map(r => r.employeeId));

        for (const emp of employees) {
            const newScore = await analyticsService.calculatePerformanceScore(emp.employeeId);

            emp.performanceScore = newScore;
            emp.recommendedPromotion = recommendedIds.has(emp.employeeId);

            await emp.save();
            updatedCount++;
        }

        res.json({
            msg: 'AI Sync completed successfully',
            updatedCount,
            recommendationsCount: recommendedIds.size
        });
    } catch (err) {
        console.error('Error syncing AI scores:', err);
        res.status(500).json({ msg: 'Sync failed', error: err.message });
    }
});

module.exports = router;
