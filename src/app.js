import express from 'express';
import errorMiddleware from './middlewares/error.middleware.js';
import { successResponse } from './utils/responseFormatter.js';
import testRoutes from './routes/test.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    return res.json(
        successResponse('Server is healthy')
    );
});

// later add routes here
app.use('/api/test', testRoutes);


// global error handler
app.use(errorMiddleware);

export default app;