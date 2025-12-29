const getNextStatus = (currentStatus) = 
  const statusHierarchy = [  
    'Harian Lepas',  
    'Outsourcing',  
    'Borongan',  
    'Kontrak',  
    'Tetap'  
  ];  
  
  const currentIndex = statusHierarchy.indexOf(currentStatus);  
  if (currentIndex === -1 || currentIndex  - 1) {  
    return null; // No next status  
  }  
  
  return statusHierarchy[currentIndex + 1];  
};  
  
module.exports = {  
  calculatePerformanceScore,  
  determinePromotionEligibility,  
  getNextStatus  
