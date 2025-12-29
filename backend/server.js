const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware  
app.use(cors());
app.use(express.json({ extended: false }));

// Define Routes  
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB  
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_attendance');

    app.listen(PORT, function () {
      console.log('Server started on port ' + PORT);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer(); 
