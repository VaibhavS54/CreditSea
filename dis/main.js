import { appState } from './state.js';
import { domRefs } from './domRefs.js';
import { appConfig } from './config.js';
import { setupEventListeners } from './eventListeners.js';
import { setupDashboardCharts } from './charts.js';
import { runSimulationCycle, simulateConnectionIssues, generateInitialErrors } from './simulation.js';
import { applyErrorFilters, renderErrorLogsTable } from './uiUpdates.js';

document.addEventListener('DOMContentLoaded', function() {
    function initializeApplication() {
        setupEventListeners(appState, domRefs, appConfig); // Pass dependencies
        setupDashboardCharts(appState, domRefs, appConfig);

        generateInitialErrors(appState, appConfig);
        
        applyErrorFilters(appState);
        renderErrorLogsTable(appState, domRefs, appConfig);

        runSimulationCycle(appState, domRefs, appConfig);
        simulateConnectionIssues(appState, domRefs, appConfig);
    }

    initializeApplication();
});