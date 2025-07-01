import { updateDashboardMetrics, refreshRateChartData, refreshErrorChartData, applyErrorFilters, renderErrorLogsTable } from './uiUpdates.js';

export function runSimulationCycle(appState, domRefs, appConfig) {
    if (appState.isProcessing) {
        appState.currentIncomingRate = Math.floor(Math.random() * (appConfig.maxIncomingRate - appConfig.minIncomingRate + 1)) + appConfig.minIncomingRate;
        appState.currentProcessedRate = Math.max(Math.floor(appState.currentIncomingRate * 0.98 - Math.random() * 10), 0);
        appState.currentErrorRate = Math.random() < 0.1 ? Math.random() * 2 : appState.currentErrorRate;
        appState.averageLatency = Math.floor(Math.random() * (appConfig.maxLatency - appConfig.minLatency + 1)) + appConfig.minLatency;
    }

    updateDashboardMetrics(appState, domRefs);
    refreshRateChartData(appState, domRefs);
    refreshErrorChartData(appState, domRefs);
    
    if (Math.random() < 0.3) {
        generateNewErrors(appState, appConfig, domRefs);
    }
    
    setTimeout(() => runSimulationCycle(appState, domRefs, appConfig), appConfig.simulationIntervalMs);
}

export function generateNewErrors(appState, appConfig, domRefs) {
    const numToGenerate = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numToGenerate; i++) {
        const errorCategory = appConfig.errorTypes[Math.floor(Math.random() * appConfig.errorTypes.length)];
        
        appState.allRecordedErrors.unshift({
            timestamp: new Date().toISOString(),
            id: `ERR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            applicant: appConfig.applicantNames[Math.floor(Math.random() * appConfig.applicantNames.length)],
            type: errorCategory,
            details: appConfig.errorReasons[Math.floor(Math.random() * appConfig.errorReasons.length)],
            status: 'open'
        });
    }
    
    if (appState.allRecordedErrors.length > appConfig.maxErrorsToKeep) {
        appState.allRecordedErrors = appState.allRecordedErrors.slice(0, appConfig.maxErrorsToKeep);
    }
    
    applyErrorFilters(appState);
    renderErrorLogsTable(appState, domRefs, appConfig);
    refreshErrorChartData(appState, domRefs);
}

export function simulateConnectionIssues(appState, domRefs, appConfig) {
    if (Math.random() < appConfig.connectionIssueChance) {
        appState.isSystemConnected = false;
        
        domRefs.connectionIndicator.innerHTML = `
            <div class="connection-status-animate w-3 h-3 rounded-full bg-red-500"></div>
            <span>Disconnected - trying to re-establish connection...</span>
        `;
        
        setTimeout(() => {
            appState.isSystemConnected = true;
            domRefs.connectionIndicator.innerHTML = `
                <div class="connection-status-animate w-3 h-3 rounded-full bg-green-500"></div>
                <span>Reconnected!</span>
            `;
            setTimeout(() => simulateConnectionIssues(appState, domRefs, appConfig), 10000); 
        }, appConfig.connectionReconnectMinMs + Math.random() * (appConfig.connectionReconnectMaxMs - appConfig.connectionReconnectMinMs)); 
    } else {
        setTimeout(() => simulateConnectionIssues(appState, domRefs, appConfig), 10000);
    }
}

export function generateInitialErrors(appState, appConfig) {
    for (let i = 0; i < appConfig.initialErrorCount; i++) {
        // Call generateNewErrors directly, but pass only appState and appConfig
        const errorCategory = appConfig.errorTypes[Math.floor(Math.random() * appConfig.errorTypes.length)];
        appState.allRecordedErrors.unshift({
            timestamp: new Date().toISOString(),
            id: `ERR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            applicant: appConfig.applicantNames[Math.floor(Math.random() * appConfig.applicantNames.length)],
            type: errorCategory,
            details: appConfig.errorReasons[Math.floor(Math.random() * appConfig.errorReasons.length)],
            status: 'open'
        });
    }
}