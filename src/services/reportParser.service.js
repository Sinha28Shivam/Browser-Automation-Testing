export const parseExecutionReport = (stdout) => {
    try {
        const report = JSON.parse(stdout);

        return {
            status: report.stats.unexpected === 0 ? 'PASSED' : 'FAILED',
            duration: report.stats.duration,
            totalTests: report.stats.expected,
            failedTests: report.stats.unexpected,
            skippedTests: report.stats.skipped
        };

    } catch {
        return {
            status: 'UNKNOWN',
            duration: 0,
            totalTests: 0,
            failedTests: 0,
            skippedTests: 0
        };
    }
};