export const parseExecutionReport = (stdout) => {
    try {
        const report = JSON.parse(stdout);

        return {
            status: report.stats.unexpected === 0 ? 'PASSED' : 'FAILED',
            duration: report.stats.duration,
            totalTests: report.stats.expected,
            failedTests: report.stats.unexpected,
            skippedTests: report.stats.skipped,
       
       
            failedDetails: report.suites?.[0]?.suites?.[0]?.specs
                ?.filter(spec => !spec.ok)
                .map(spec => ({
                    title: spec.title,
                    error: spec.tests?.[0]?.results?.[0]?.errors?.[0]?.message || 'Unknown error'
                })) || []
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