const validateMachineId = (req, res, next) => {
    const { machineId } = req.params;
    if (!machineId || isNaN(parseInt(machineId))) {
        return res.status(400).json({
            success: false,
            error: 'Invalid machine ID. Must be a valid number.'
        });
    }
    next();
};

const validateReadingQuery = (req, res, next) => {
    const { limit, startDate, endDate } = req.query;

    if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 1000)) {
        return res.status(400).json({
            success: false,
            error: 'Limit must be a number between 1 and 1000'
        });
    }

    if (startDate && isNaN(Date.parse(startDate))) {
        return res.status(400).json({
            success: false,
            error: 'Invalid startDate format. Use ISO 8601 format.'
        });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
        return res.status(400).json({
            success: false,
            error: 'Invalid endDate format. Use ISO 8601 format.'
        });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
            success: false,
            error: 'startDate cannot be after endDate'
        });
    }

    next();
};

const validateTelemetryData = (req, res, next) => {
    const { machine_id, metrics } = req.body;

    if (!machine_id || typeof machine_id !== 'number' || machine_id < 1) {
        return res.status(400).json({
            success: false,
            error: 'Valid machine_id (positive number) is required'
        });
    }

    if (!metrics || typeof metrics !== 'object') {
        return res.status(400).json({
            success: false,
            error: 'Metrics object is required'
        });
    }

    // Validate common metrics
    const validMetrics = ['vibration', 'oil_level', 'temperature', 'pressure', 'rpm'];
    const providedMetrics = Object.keys(metrics);

    if (providedMetrics.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'At least one metric must be provided'
        });
    }

    for (const metric of providedMetrics) {
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({
                success: false,
                error: `Invalid metric: ${metric}. Valid metrics: ${validMetrics.join(', ')}`
            });
        }

        const value = metrics[metric];
        if (typeof value !== 'number' || isNaN(value)) {
            return res.status(400).json({
                success: false,
                error: `Invalid value for metric ${metric}. Must be a number.`
            });
        }
    }

    next();
};

module.exports = {
    validateMachineId,
    validateReadingQuery,
    validateTelemetryData
};
