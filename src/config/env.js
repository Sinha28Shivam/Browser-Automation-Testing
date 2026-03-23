import dotenv from 'dotenv';

dotenv.config();

const env = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    AZURE_INFERENCE_ENDPOINT: process.env.AZURE_INFERENCE_ENDPOINT,
    AZURE_INFERENCE_KEY: process.env.AZURE_INFERENCE_KEY,
    AZURE_MODEL_NAME: process.env.AZURE_MODEL_NAME
    // Add other environment variables as needed
}

export default env;