export const appConfig = {
    errorTypes: ['validation', 'api', 'timeout', 'database'],
    applicantNames: ['John Smith', 'Emma Johnson', 'Michael Williams', 'Sophia Brown', 'James Jones'],
    errorReasons: [
        'Invalid credit score format',
        'Missing income verification',
        'Address validation failed',
        'API timeout on credit check',
        'Database connection error',
        'Invalid SSN format',
        'Employment verification failed',
        'Debt-to-income ratio too high'
    ],
    maxErrorsToKeep: 200,
    simulatedRetrySuccessRate: 0.7,
    minIncomingRate: 450,
    maxIncomingRate: 550,
    minLatency: 80,
    maxLatency: 180,
    simulationIntervalMs: 1000,
    connectionIssueChance: 0.02,
    connectionReconnectMinMs: 3000,
    connectionReconnectMaxMs: 8000,
    initialErrorCount: 15,
    chartTimeLabels: Array.from({ length: 30 }, (_, i) => `${(i * 2)}s`),
    errorChartLabels: ['Validation Issues', 'API Call Failures', 'System Timeouts', 'Database Problems'],
    errorChartColors: {
        validation: { background: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 1)' },
        api: { background: 'rgba(249, 115, 22, 0.8)', border: 'rgba(249, 115, 22, 1)' },
        timeout: { background: 'rgba(234, 179, 8, 0.8)', border: 'rgba(234, 179, 8, 1)' },
        database: { background: 'rgba(20, 184, 166, 0.8)', border: 'rgba(20, 184, 166, 1)' },
        default: { background: 'rgba(100, 116, 139, 0.8)', border: 'rgba(100, 116, 139, 1)' }
    }
};