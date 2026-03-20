import { errorResponse } from "../utils/responseFormatter.js";
import { logError } from "../utils/logger.js";

const errorMiddleware = (err, req, res, next) => {
    logError(err.stack);

    return res.status(500).json(
        errorResponse(err.message || 'Internal server Error')
    );
};

export default errorMiddleware;