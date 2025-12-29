const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

// @route    GET api/dashboard/stats  
// @desc     Get dashboard statistics  
// @access   Private  
router.get('/stats', auth, async (req, res) => {
  try {
    // Get total employees  
    const totalEmployees = await Employee.countDocuments();

    // Get employees by status  
    const employeesByStatus = await Employee.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get employees eligible for promotion  
    const promotionRecommended = await Employee.countDocuments({ recommendedPromotion: true });

    // Get average performance score  
    const avgPerformance = await Employee.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$performanceScore' }
        }
      }
    ]);

    const stats = {
      totalEmployees,
      employeesByStatus,
      promotionRecommended,
      averagePerformance: avgPerformance[0] ? Math.round(avgPerformance[0].avgScore * 100) / 100 : 0
    };

    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 
