import app from './src/app.js';
import env from './src/config/env.js';
import { logInfo } from './src/utils/logger.js';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
    logInfo(`Server is running on port ${PORT}`);
});