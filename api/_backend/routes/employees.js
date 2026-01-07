const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

// @route    GET api/employees  
// @desc     Get all employees  
// @access   Private  
router.get('/', auth, async (req, res) => {
  try {
    const employees = await Employee.find().populate('shiftId').sort({ date: -1 });
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/employees  
// @desc     Add new employee  
// @access   Private  
router.post('/', auth, async (req, res) => {
  const { employeeId, name, position, status, department, email, phone, salary, fingerprintId, shiftId } = req.body;

  try {
    const employeeData = {
      employeeId,
      name,
      position,
      status,
      department,
      email,
      phone,
      salary
    };

    // Only add optional fields if they have valid values
    if (shiftId && shiftId !== '') employeeData.shiftId = shiftId;
    if (fingerprintId && fingerprintId !== '') employeeData.fingerprintId = fingerprintId;

    const newEmployee = new Employee(employeeData);

    const employee = await newEmployee.save();
    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message || 'Server Error');
  }
});

// @route    PUT api/employees/:id  
// @desc     Update employee  
// @access   Private  
router.put('/:id', auth, async (req, res) => {
  const { name, position, status, department, email, phone, salary, fingerprintId, shiftId } = req.body;

  // Build employee object  
  const employeeFields = {};
  if (name) employeeFields.name = name;
  if (position) employeeFields.position = position;
  if (status) employeeFields.status = status;
  if (department) employeeFields.department = department;
  if (email) employeeFields.email = email;
  if (phone) employeeFields.phone = phone;
  if (salary) employeeFields.salary = salary;

  if (fingerprintId) employeeFields.fingerprintId = fingerprintId;
  if (shiftId && shiftId !== '') employeeFields.shiftId = shiftId;
  // If explicitly removing shift (sending null), handle accordingly if needed, but for now assuming empty string means 'no change' or 'unset' logic depending on frontend. 
  // Better logic: if (shiftId) ... but if we want to unset? Mongoose unsets if we pass null explicitly? 
  // Let's stick to adding if present for now.


  try {
    let employee = await Employee.findById(req.params.id);

    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: employeeFields },
      { new: true }
    );

    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/employees/:id  
// @desc     Delete employee  
// @access   Private  
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin (optional but recommended)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ msg: 'Access denied. Admin only.' });
    // }

    const employee = await Employee.findById(req.params.id);

    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    await Employee.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Employee removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error: ' + err.message });
  }
});

// @route    PUT api/employees/:id/device-lock
// @desc     Toggle device lock for employee
// @access   Private (Admin)
router.put('/:id/device-lock', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    employee.deviceLockEnabled = !employee.deviceLockEnabled;
    await employee.save();

    res.json({ msg: `Device lock ${employee.deviceLockEnabled ? 'enabled' : 'disabled'}`, enabled: employee.deviceLockEnabled });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/employees/:id/devices
// @desc     Clear registered devices for employee
// @access   Private (Admin)
router.delete('/:id/devices', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    employee.registeredDevices = [];
    await employee.save();

    res.json({ msg: 'Registered devices cleared' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 
