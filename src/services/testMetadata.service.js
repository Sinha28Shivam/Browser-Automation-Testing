import { STATUS } from '../constants/status.constant.js';

export const createTestMetadata = async ({ title, url, scenario, selectors }) => {
    const testId = Date.now().toString();

    return {
        testId,
        title,
        url,
        scenario,
        selectors,
        status: STATUS.PENDING,
        createdAt: new Date().toISOString()
    };
};