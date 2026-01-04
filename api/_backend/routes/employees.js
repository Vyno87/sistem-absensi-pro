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
  const { employeeId, name, position, status, department, email, phone, salary } = req.body;

  try {
    const newEmployee = new Employee({
      employeeId,
      name,
      position,
      status,
      department,
      email,
      phone,
      salary,
      shiftId: req.body.shiftId // Optional: assign shift
    });

    const employee = await newEmployee.save();
    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/employees/:id  
// @desc     Update employee  
// @access   Private  
router.put('/:id', auth, async (req, res) => {
  const { name, position, status, department, email, phone, salary } = req.body;

  // Build employee object  
  const employeeFields = {};
  if (name) employeeFields.name = name;
  if (position) employeeFields.position = position;
  if (status) employeeFields.status = status;
  if (department) employeeFields.department = department;
  if (email) employeeFields.email = email;
  if (phone) employeeFields.phone = phone;
  if (salary) employeeFields.salary = salary;
  if (req.body.shiftId) employeeFields.shiftId = req.body.shiftId;

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
    const employee = await Employee.findById(req.params.id);

    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    await Employee.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Employee removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 
