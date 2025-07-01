document.addEventListener('DOMContentLoaded', () => {

    const appState = {
        isProcessing: true,
        isConnected: true,
        currentIncomingRate: 0,
        currentProcessedRate: 0,
        currentErrorRate: 0,
        averageLatency: 0,
        processingBatchSize: 100,
        activeRetryStrategy: 'immediate',
        allErrors: [],
        displayErrors: [],
        pagination: {
            currentPage: 1,
            itemsPerPage: 10,
        },
        filters: {
            searchTerm: '',
            errorType: '',
            timeframe: '5m',
        },
        charts: {
            rateChartData: [],
            errorTypeCounts: { validation: 0, api: 0, timeout: 0, database: 0 },
            isInitialized: false,
        },
        rateChartInstance: null,
        errorChartInstance: null,
    };

    const dom = {
        connectionStatusDisplay: document.getElementById('connection-status'),
        pauseResumeButton: document.getElementById('pause-btn'),
        incomingRateDisplay: document.getElementById('incoming-rate'),
        processedRateDisplay: document.getElementById('processed-rate'),
        errorRateDisplay: document.getElementById('error-rate'),
        avgLatencyDisplay: document.getElementById('avg-latency'),
        errorLogsTableBody: document.getElementById('error-logs-body'),
        paginationCurrentCount: document.getElementById('current-count'),
        paginationTotalCount: document.getElementById('total-count'),
        prevPageButton: document.getElementById('prev-page'),
        nextPageButton: document.getElementById('next-page'),
        searchInput: document.getElementById('search-input'),
        errorTypeFilter: document.getElementById('error-type-filter'),
        timeframeFilter: document.getElementById('timeframe-filter'),
        retryFailedButton: document.getElementById('retry-failed'),
        batchSizeSelect: document.getElementById('batch-size'),
        rateChartCanvasCtx: document.getElementById('rateChart').getContext('2d'),
        errorChartCanvasCtx: document.getElementById('errorChart').getContext('2d'),
    };

    dom.pauseResumeButton.addEventListener('click', toggleProcessing);
    dom.searchInput.addEventListener('input', handleSearchInput);
    dom.errorTypeFilter.addEventListener('change', handleFilterChange);
    dom.timeframeFilter.addEventListener('change', handleFilterChange);
    dom.prevPageButton.addEventListener('click', goToPreviousPage);
    dom.nextPageButton.addEventListener('click', goToNextPage);
    dom.retryFailedButton.addEventListener('click', retryAllFailedRecords);
    dom.batchSizeSelect.addEventListener('change', updateBatchSize);

    document.querySelectorAll('input[name="retry-strategy"]').forEach(radio => {
        radio.addEventListener('change', updateRetryStrategy);
    });

    function initializeCharts() {
        if (appState.charts.isInitialized) return;

        appState.rateChartInstance = new Chart(dom.rateChartCanvasCtx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 30 }, (_, i) => `${i * 2}s`),
                datasets: [
                    {
                        label: 'Incoming Loans',
                        data: Array(30).fill(0),
                        borderColor: 'rgba(79, 70, 229, 1)',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 2,
                        tension: 0.4
                    },
                    {
                        label: 'Processed Loans',
                        data: Array(30).fill(0),
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Loans per second'
                        }
                    }
                }
            }
        });

        appState.errorChartInstance = new Chart(dom.errorChartCanvasCtx, {
            type: 'doughnut',
            data: {
                labels: ['Validation', 'API Failures', 'Timeouts', 'Database Errors'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(234, 179, 8, 0.8)',
                        'rgba(20, 184, 166, 0.8)'
                    ],
                    borderColor: [
                        'rgba(239, 68, 68, 1)',
                        'rgba(249, 115, 22, 1)',
                        'rgba(234, 179, 8, 1)',
                        'rgba(20, 184, 166, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });

        appState.charts.isInitialized = true;
    }

    function simulateProcessing() {
        if (appState.isProcessing) {
            appState.currentIncomingRate = Math.floor(Math.random() * 100) + 450;
            appState.currentProcessedRate = Math.max(Math.floor(appState.currentIncomingRate * 0.98 - Math.random() * 10), 0);
            appState.currentErrorRate = Math.random() < 0.1 ? Math.random() * 2 : appState.currentErrorRate;
            appState.averageLatency = Math.floor(Math.random() * 100) + 80;
        }

        updateMetricsDisplay();
        updateRateCharts();
        updateErrorCharts();

        if (Math.random() < 0.3) {
            generateNewErrors();
        }

        setTimeout(simulateProcessing, 1000);
    }

    function generateNewErrors() {
        const errorCategories = ['validation', 'api', 'timeout', 'database'];
        const sampleNames = ['John Smith', 'Emma Johnson', 'Michael Williams', 'Sophia Brown', 'James Jones'];
        const errorReasons = [
            'Invalid credit score format', 'Missing income verification',
            'Address validation failed', 'API timeout on credit check',
            'Database connection error', 'Invalid SSN format',
            'Employment verification failed', 'Debt-to-income ratio too high'
        ];

        const numberOfNewErrors = Math.floor(Math.random() * 3);

        for (let i = 0; i < numberOfNewErrors; i++) {
            const errorType = errorCategories[Math.floor(Math.random() * errorCategories.length)];
            appState.allErrors.unshift({
                timestamp: new Date().toISOString(),
                id: `ERR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                applicant: sampleNames[Math.floor(Math.random() * sampleNames.length)],
                type: errorType,
                details: errorReasons[Math.floor(Math.random() * errorReasons.length)],
                status: 'open'
            });
        }

        if (appState.allErrors.length > 200) {
            appState.allErrors = appState.allErrors.slice(0, 200);
        }

        applyErrorFilters();
        renderErrorLogTable();
        updateErrorCharts();
    }

    function updateMetricsDisplay() {
        dom.incomingRateDisplay.textContent = appState.currentIncomingRate;
        dom.processedRateDisplay.textContent = appState.currentProcessedRate;
        dom.errorRateDisplay.textContent = `${appState.currentErrorRate.toFixed(1)}%`;
        dom.avgLatencyDisplay.textContent = `${appState.averageLatency}ms`;

        const incomingRateDelta = appState.currentIncomingRate - appState.currentProcessedRate;
        const incomingChangeSpan = dom.incomingRateDisplay.nextElementSibling;
        const errorRateStatusSpan = dom.errorRateDisplay.nextElementSibling;
        const latencyStatusSpan = dom.avgLatencyDisplay.nextElementSibling;

        if (incomingRateDelta > 20) {
            incomingChangeSpan.className = 'text-amber-500 text-sm mb-1';
            incomingChangeSpan.textContent = `+${incomingRateDelta}/sec`;
        } else if (incomingRateDelta < -10) {
            incomingChangeSpan.className = 'text-green-500 text-sm mb-1';
            incomingChangeSpan.textContent = `${incomingRateDelta}/sec`;
        } else {
            incomingChangeSpan.className = 'text-gray-500 text-sm mb-1';
            incomingChangeSpan.textContent = 'stable';
        }

        if (appState.currentErrorRate > 1) {
            errorRateStatusSpan.className = 'text-red-500 text-sm mb-1';
            errorRateStatusSpan.textContent = `${Math.floor(appState.currentErrorRate * appState.currentProcessedRate / 100)} in last min`;
        } else {
            errorRateStatusSpan.className = 'text-gray-500 text-sm mb-1';
            errorRateStatusSpan.textContent = 'healthy';
        }

        if (appState.averageLatency > 180) {
            latencyStatusSpan.className = 'text-red-500 text-sm mb-1';
            latencyStatusSpan.textContent = 'above SLA';
        } else {
            latencyStatusSpan.className = 'text-green-500 text-sm mb-1';
            latencyStatusSpan.textContent = 'normal';
        }
    }

    function updateRateCharts() {
        if (!appState.charts.isInitialized) return;

        const incomingData = appState.rateChartInstance.data.datasets[0].data;
        const processedData = appState.rateChartInstance.data.datasets[1].data;

        incomingData.shift();
        incomingData.push(appState.currentIncomingRate);

        processedData.shift();
        processedData.push(appState.currentProcessedRate);

        appState.rateChartInstance.update();
    }

    function updateErrorCharts() {
        if (!appState.charts.isInitialized) return;

        const counts = { validation: 0, api: 0, timeout: 0, database: 0 };
        appState.allErrors.forEach(error => {
            if (counts.hasOwnProperty(error.type)) {
                counts[error.type]++;
            }
        });
        appState.charts.errorTypeCounts = counts;

        appState.errorChartInstance.data.datasets[0].data = [
            appState.charts.errorTypeCounts.validation,
            appState.charts.errorTypeCounts.api,
            appState.charts.errorTypeCounts.timeout,
            appState.charts.errorTypeCounts.database
        ];

        appState.errorChartInstance.update();
    }

    function applyErrorFilters() {
        appState.displayErrors = appState.allErrors.filter(error => {
            const searchTermLower = appState.filters.searchTerm.toLowerCase();
            const matchesSearch = searchTermLower === '' ||
                error.id.toLowerCase().includes(searchTermLower) ||
                error.applicant.toLowerCase().includes(searchTermLower) ||
                error.details.toLowerCase().includes(searchTermLower);

            const matchesType = appState.filters.errorType === '' ||
                error.type === appState.filters.errorType;

            const now = new Date();
            const errorTime = new Date(error.timestamp);
            let timeframeMinutes;

            switch (appState.filters.timeframe) {
                case '5m': timeframeMinutes = 5; break;
                case '15m': timeframeMinutes = 15; break;
                case '1h': timeframeMinutes = 60; break;
                case '24h': timeframeMinutes = 1440; break;
                default: timeframeMinutes = 5;
            }

            const matchesTimeframe = (now.getTime() - errorTime.getTime()) <= timeframeMinutes * 60 * 1000;

            return matchesSearch && matchesType && matchesTimeframe;
        });
    }

    function renderErrorLogTable() {
        dom.errorLogsTableBody.innerHTML = '';

        const { currentPage, itemsPerPage } = appState.pagination;
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, appState.displayErrors.length);
        const visibleErrors = appState.displayErrors.slice(startIdx, endIdx);

        if (visibleErrors.length === 0) {
            const row = document.createElement('tr');
            row.className = 'text-center py-4';
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.className = 'px-6 py-4 text-gray-500';
            cell.textContent = 'No errors match the current filters.';
            row.appendChild(cell);
            dom.errorLogsTableBody.appendChild(row);
            return;
        }

        visibleErrors.forEach(error => {
            const row = document.createElement('tr');
            row.className = 'error-row hover:bg-gray-50 transition-colors';

            const timestampCell = document.createElement('td');
            timestampCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
            timestampCell.textContent = new Date(error.timestamp).toLocaleTimeString();
            row.appendChild(timestampCell);

            const idCell = document.createElement('td');
            idCell.className = 'px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900';
            idCell.textContent = error.id;
            row.appendChild(idCell);

            const applicantCell = document.createElement('td');
            applicantCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            applicantCell.textContent = error.applicant;
            row.appendChild(applicantCell);

            const typeCell = document.createElement('td');
            typeCell.className = 'px-6 py-4 whitespace-nowrap';
            const typeBadge = document.createElement('span');
            typeBadge.className = 'px-2 py-1 text-xs rounded-full capitalize';

            switch (error.type) {
                case 'validation': typeBadge.className += ' bg-red-100 text-red-800'; typeBadge.textContent = 'Validation'; break;
                case 'api': typeBadge.className += ' bg-orange-100 text-orange-800'; typeBadge.textContent = 'API Failure'; break;
                case 'timeout': typeBadge.className += ' bg-yellow-100 text-yellow-800'; typeBadge.textContent = 'Timeout'; break;
                case 'database': typeBadge.className += ' bg-teal-100 text-teal-800'; typeBadge.textContent = 'Database'; break;
                default: typeBadge.className += ' bg-gray-100 text-gray-800'; typeBadge.textContent = error.type;
            }
            typeCell.appendChild(typeBadge);
            row.appendChild(typeCell);

            const detailsCell = document.createElement('td');
            detailsCell.className = 'px-6 py-4 text-sm text-gray-500';
            detailsCell.textContent = error.details;
            row.appendChild(detailsCell);

            const actionsCell = document.createElement('td');
            actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';

            const retryBtn = document.createElement('button');
            retryBtn.className = 'text-indigo-600 hover:text-indigo-900 mr-3';
            retryBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" /></svg>';
            retryBtn.title = 'Retry this record';
            retryBtn.addEventListener('click', () => retrySingleRecord(error.id));
            if (error.status !== 'open') {
                retryBtn.disabled = true;
                retryBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }

            const flagBtn = document.createElement('button');
            flagBtn.className = 'text-amber-600 hover:text-amber-900';
            flagBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd" /></svg>';
            flagBtn.title = 'Flag for review';

            actionsCell.appendChild(retryBtn);
            actionsCell.appendChild(flagBtn);
            row.appendChild(actionsCell);

            dom.errorLogsTableBody.appendChild(row);
        });

        dom.paginationCurrentCount.textContent = `${startIdx + 1}-${endIdx}`;
        dom.paginationTotalCount.textContent = appState.displayErrors.length;
        dom.prevPageButton.disabled = currentPage === 1;
        dom.nextPageButton.disabled = endIdx >= appState.displayErrors.length;
    }

    function toggleProcessing() {
        appState.isProcessing = !appState.isProcessing;
        dom.pauseResumeButton.textContent = appState.isProcessing ? 'Pause Processing' : 'Resume Processing';

        if (appState.isProcessing) {
            dom.pauseResumeButton.classList.remove('bg-gray-600');
            dom.pauseResumeButton.classList.add('bg-indigo-700');
        } else {
            dom.pauseResumeButton.classList.remove('bg-indigo-700');
            dom.pauseResumeButton.classList.add('bg-gray-600');

            const slowDownRates = () => {
                appState.currentIncomingRate = Math.max(appState.currentIncomingRate - 10, 0);
                appState.currentProcessedRate = Math.max(appState.currentProcessedRate - 10, 0);
                updateMetricsDisplay();

                if (appState.currentIncomingRate > 0 || appState.currentProcessedRate > 0) {
                    setTimeout(slowDownRates, 200);
                }
            };
            slowDownRates();
        }
    }

    function handleSearchInput(event) {
        appState.filters.searchTerm = event.target.value;
        appState.pagination.currentPage = 1;
        applyErrorFilters();
        renderErrorLogTable();
    }

    function handleFilterChange() {
        appState.filters.errorType = dom.errorTypeFilter.value;
        appState.filters.timeframe = dom.timeframeFilter.value;
        appState.pagination.currentPage = 1;
        applyErrorFilters();
        renderErrorLogTable();
    }

    function goToPreviousPage() {
        if (appState.pagination.currentPage > 1) {
            appState.pagination.currentPage--;
            renderErrorLogTable();
        }
    }

    function goToNextPage() {
        const totalPages = Math.ceil(appState.displayErrors.length / appState.pagination.itemsPerPage);
        if (appState.pagination.currentPage < totalPages) {
            appState.pagination.currentPage++;
            renderErrorLogTable();
        }
    }

    function retryAllFailedRecords() {
        const openErrors = appState.allErrors.filter(e => e.status === 'open');
        const recordsToRetry = Math.min(openErrors.length, appState.processingBatchSize);

        if (recordsToRetry === 0) {
            alert('No open errors to retry!');
            return;
        }

        alert(`Attempting to retry ${recordsToRetry} records using the ${appState.activeRetryStrategy} strategy...`);

        setTimeout(() => {
            for (let i = 0; i < recordsToRetry; i++) {
                openErrors[i].status = 'retrying';
            }
            renderErrorLogTable();

            setTimeout(() => {
                for (let i = 0; i < recordsToRetry; i++) {
                    if (Math.random() > 0.3) {
                        openErrors[i].status = 'retry-success';
                    } else {
                        openErrors[i].status = 'retry-failed';
                    }
                }
                applyErrorFilters();
                renderErrorLogTable();
            }, 3000);
        }, 500);
    }

    function retrySingleRecord(errorId) {
        const record = appState.allErrors.find(e => e.id === errorId);
        if (record && record.status === 'open') {
            record.status = 'retrying';
            renderErrorLogTable();

            setTimeout(() => {
                record.status = Math.random() > 0.3 ? 'retry-success' : 'retry-failed';
                renderErrorLogTable();
            }, 1500);
        } else if (record) {
             alert(`Record ${errorId} is already being processed or resolved.`);
        }
    }

    function updateBatchSize() {
        appState.processingBatchSize = parseInt(dom.batchSizeSelect.value, 10);
    }

    function updateRetryStrategy(event) {
        appState.activeRetryStrategy = event.target.value;
    }

    initializeCharts();
    simulateProcessing();

    for (let i = 0; i < 15; i++) {
        generateNewErrors();
    }
    applyErrorFilters();
    renderErrorLogTable();
});