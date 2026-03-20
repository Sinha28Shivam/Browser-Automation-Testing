import express from 'express';
import { createTest, runTest } from '../controller/test.controller.js';

const router = express.Router();

router.post('/create', createTest);
router.post('/run', runTest);
// all test related routes will go here

export default router;
