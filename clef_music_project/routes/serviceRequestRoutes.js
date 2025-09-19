const express = require('express');
const { createServiceRequest } = require('../controllers/serviceRequestController');

const router = express.Router();

router.post('/', createServiceRequest);

module.exports = router;
