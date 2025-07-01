export function updateDashboardMetrics(appState, domRefs) {
    domRefs.incomingDisplay.textContent = appState.currentIncomingRate;
    domRefs.processedDisplay.textContent = appState.currentProcessedRate;
    domRefs.errorRateDisplay.textContent = `${appState.currentErrorRate.toFixed(1)}%`;
    domRefs.latencyDisplay.textContent = `${appState.averageLatency}ms`;
    
    const incomingRateSpan = domRefs.incomingDisplay.nextElementSibling;
    const errorRateSpan = domRefs.errorRateDisplay.nextElementSibling;
    const latencySpan = domRefs.latencyDisplay.nextElementSibling;

    const diffIncomingProcessed = appState.currentIncomingRate - appState.currentProcessedRate;
    if (diffIncomingProcessed > 20) {
        incomingRateSpan.className = 'text-amber-500 text-sm mb-1';
        incomingRateSpan.textContent = `+${diffIncomingProcessed}/sec (Queueing)`;
    } else if (diffIncomingProcessed < -10) {
        incomingRateSpan.className = 'text-green-500 text-sm mb-1';
        incomingRateSpan.textContent = `${diffIncomingProcessed}/sec (Under Capacity)`;
    } else {
        incomingRateSpan.className = 'text-gray-500 text-sm mb-1';
        incomingRateSpan.textContent = 'Steady Flow';
    }
    
    if (appState.currentErrorRate > 1) {
        errorRateSpan.className = 'text-red-500 text-sm mb-1';
        errorRateSpan.textContent = `${Math.floor(appState.currentErrorRate * appState.currentProcessedRate / 100)} issues/min`;
    } else {
        errorRateSpan.className = 'text-gray-500 text-sm mb-1';
        errorRateSpan.textContent = 'Healthy';
    }
    
    if (appState.averageLatency > 180) {
        latencySpan.className = 'text-red-500 text-sm mb-1';
        latencySpan.textContent = 'Above SLA!';
    } else {
        latencySpan.className = 'text-gray-500 text-sm mb-1';
        latencySpan.textContent = 'Optimal';
    }
}

export function refreshRateChartData(appState, domRefs) {
    if (!appState.chartsReady) return;
    
    const incomingDataset = domRefs.loanRateChart.data.datasets[0].data;
    const processedDataset = domRefs.loanRateChart.data.datasets[1].data;
    
    incomingDataset.shift();
    incomingDataset.push(appState.currentIncomingRate);
    
    processedDataset.shift();
    processedDataset.push(appState.currentProcessedRate);
    
    domRefs.loanRateChart.update();
}

export function refreshErrorChartData(appState, domRefs) {
    if (!appState.chartsReady) return;
    
    const errorTypeCounts = {
        validation: 0,
        api: 0,
        timeout: 0,
        database: 0
    };
    
    appState.allRecordedErrors.forEach(err => {
        if (errorTypeCounts.hasOwnProperty(err.type)) {
            errorTypeCounts[err.type]++;
        }
    });
    
    domRefs.errorBreakdownChart.data.datasets[0].data = [
        errorTypeCounts.validation,
        errorTypeCounts.api,
        errorTypeCounts.timeout,
        errorTypeCounts.database
    ];
    
    domRefs.errorBreakdownChart.update();
}

export function applyErrorFilters(appState) {
    appState.displayableErrors = appState.allRecordedErrors.filter(err => {
        const matchesSearch = appState.currentSearchTerm === '' || 
            err.id.toLowerCase().includes(appState.currentSearchTerm.toLowerCase()) || 
            err.applicant.toLowerCase().includes(appState.currentSearchTerm.toLowerCase()) || 
            err.details.toLowerCase().includes(appState.currentSearchTerm.toLowerCase());
        
        const matchesType = appState.activeErrorTypeFilter === '' || 
            err.type === appState.activeErrorTypeFilter;
        
        const now = new Date();
        const errorTime = new Date(err.timestamp);
        let filterMinutes;
        
        switch (appState.activeTimeframeFilter) {
            case '5m': filterMinutes = 5; break;
            case '15m': filterMinutes = 15; break;
            case '1h': filterMinutes = 60; break;
            case '24h': filterMinutes = 1440; break;
            default: filterMinutes = 5;
        }
        
        const matchesTimeframe = (now - errorTime) <= filterMinutes * 60 * 1000;
        
        return matchesSearch && matchesType && matchesTimeframe;
    });
}

function createErrorRow(errorEntry, appConfig, retrySpecificRecord) {
    const row = document.createElement('tr');
    row.className = 'error-row hover:bg-gray-50 transition-colors';
    
    const timeCell = document.createElement('td');
    timeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
    timeCell.textContent = new Date(errorEntry.timestamp).toLocaleTimeString();
    row.appendChild(timeCell);
    
    const idCell = document.createElement('td');
    idCell.className = 'px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900';
    idCell.textContent = errorEntry.id;
    row.appendChild(idCell);
    
    const applicantCell = document.createElement('td');
    applicantCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
    applicantCell.textContent = errorEntry.applicant;
    row.appendChild(applicantCell);
    
    const typeCell = document.createElement('td');
    typeCell.className = 'px-6 py-4 whitespace-nowrap';
    const typeBadge = document.createElement('span');
    typeBadge.className = 'px-2 py-1 text-xs rounded-full capitalize';
    
    const typeStyle = appConfig.errorChartColors[errorEntry.type] || appConfig.errorChartColors.default;
    typeBadge.classList.add(typeStyle.background.replace('0.8', '1').replace('rgba(', 'bg-').replace(', 1)', '-100').replace(/ /g, '-').replace(/,/g, '-').replace(/\./g, ''),
                            typeStyle.border.replace('1)', '').replace('rgba(', 'text-').replace(/ /g, '-').replace(/,/g, '-').replace(/\./g, ''));

    typeBadge.textContent = errorEntry.type.charAt(0).toUpperCase() + errorEntry.type.slice(1).replace('api', 'API Failure').replace('timeout', 'Timeout').replace('database', 'Database').replace('validation', 'Validation');

    typeCell.appendChild(typeBadge);
    row.appendChild(typeCell);
    
    const detailsCell = document.createElement('td');
    detailsCell.className = 'px-6 py-4 text-sm text-gray-500';
    detailsCell.textContent = errorEntry.details;
    row.appendChild(detailsCell);
    
    const actionsCell = document.createElement('td');
    actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
    
    const retryButton = document.createElement('button');
    retryButton.className = 'text-indigo-600 hover:text-indigo-900 mr-3';
    retryButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" /></svg>';
    retryButton.title = 'Retry this individual record';
    // Pass retrySpecificRecord as a dependency
    retryButton.addEventListener('click', () => retrySpecificRecord(errorEntry.id));
    
    const flagButton = document.createElement('button');
    flagButton.className = 'text-amber-600 hover:text-amber-900';
    flagButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd" /></svg>';
    flagButton.title = 'Flag for manual review';
    
    actionsCell.appendChild(retryButton);
    actionsCell.appendChild(flagButton);
    row.appendChild(actionsCell);
    
    return row;
}

export function renderErrorLogsTable(appState, domRefs, appConfig, retrySpecificRecord) { // Add retrySpecificRecord to parameters
    domRefs.errorLogTableBody.innerHTML = '';
    
    const startIndex = (appState.activePage - 1) * appState.logsPerPage;
    const endIndex = Math.min(startIndex + appState.logsPerPage, appState.displayableErrors.length);
    const currentBatchOfErrors = appState.displayableErrors.slice(startIndex, endIndex);
    
    if (currentBatchOfErrors.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'text-center py-4';
        
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 6;
        emptyCell.className = 'px-6 py-4 text-gray-500';
        emptyCell.textContent = 'No errors found matching your current criteria.';
        
        emptyRow.appendChild(emptyCell);
        domRefs.errorLogTableBody.appendChild(emptyRow);
        return;
    }
    
    currentBatchOfErrors.forEach(errorEntry => {
        domRefs.errorLogTableBody.appendChild(createErrorRow(errorEntry, appConfig, retrySpecificRecord));
    });
    
    domRefs.paginationCurrentRange.textContent = `${startIndex + 1}-${endIndex}`;
    domRefs.paginationTotalCount.textContent = appState.displayableErrors.length;
    
    domRefs.previousPageButton.disabled = appState.activePage === 1;
    domRefs.nextPageButton.disabled = endIndex >= appState.displayableErrors.length;
}