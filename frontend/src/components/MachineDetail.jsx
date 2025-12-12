import React, { useEffect, useState } from "react";
import { machinesAPI } from "../services/api";
import machinesService from "../services/machinesService";
import toast from "react-hot-toast";

import { useParams } from "react-router-dom";

export default function MachineDetail({ machineId: propMachineId, onClose }) {
  const params = useParams();
  const machineId = propMachineId || params.id;
  const [readings, setReadings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    limit: 50,
    metric: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadData();
  }, [machineId, filters]);

  const loadData = async () => {
    try {
      const resp = await machinesService.get(machineId);
      const m = resp.data || resp;
      setMachine(m);
      const allReadings = m?.readings || [];
      // apply simple filters
      let r = allReadings.slice().reverse();
      if (filters.metric) r = r.filter((x) => x.metric === filters.metric);
      if (filters.startDate) r = r.filter((x) => new Date(x.ts) >= new Date(filters.startDate));
      if (filters.endDate) r = r.filter((x) => new Date(x.ts) <= new Date(filters.endDate));
      r = r.slice(0, filters.limit);
      setReadings(r);

      // compute simple analytics summary
      const byMetric = {};
      allReadings.forEach((rd) => {
        byMetric[rd.metric] = byMetric[rd.metric] || [];
        byMetric[rd.metric].push(rd.value);
      });
      const summary = Object.keys(byMetric).map((metric) => {
        const vals = byMetric[metric];
        const count = vals.length;
        const avg = vals.reduce((a, b) => a + b, 0) / count || 0;
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const mean = avg;
        const stddev = Math.sqrt(vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / count) || 0;
        return { metric, count, avg_value: avg, min_value: min, max_value: max, stddev_value: stddev };
      });
      setAnalytics(summary);
    } catch (error) {
      console.error("Failed to load machine data:", error);
      toast.error("Failed to load machine details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!machine) return;
    machinesService.save(machine);
    toast.success('Machine saved');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatValue = (value, metric) => {
    if (typeof value !== "number") return value;

    switch (metric) {
      case "vibration":
        return `${value.toFixed(2)} Hz`;
      case "oil_level":
        return `${value.toFixed(1)}%`;
      case "temperature":
        return `${value.toFixed(1)}°C`;
      case "pressure":
        return `${value.toFixed(1)} PSI`;
      case "rpm":
        return `${value.toFixed(0)} RPM`;
      default:
        return value.toFixed(2);
    }
  };

  if (loading) {
    return (
      <div className="modal-backdrop flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading machine data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {machine ? `${machine.name} (ID ${machineId})` : `Machine ${machineId} Details`}
              </h2>
              {machine && (
                <input
                  value={machine.name}
                  onChange={(e) => setMachine({ ...machine, name: e.target.value })}
                  className="border px-2 py-1 rounded text-sm"
                />
              )}
            </div>
            <p className="text-gray-600">Sensor readings and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Analytics Summary */}
          {analytics && analytics.length > 0 && (
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Analytics Summary (Last 24 Hours)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.map((item) => (
                  <div
                    key={item.metric}
                    className="bg-white p-4 rounded-lg border"
                  >
                    <h4 className="font-medium text-gray-900 capitalize mb-2">
                      {item.metric.replace("_", " ")}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Count:</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg:</span>
                        <span className="font-medium">
                          {formatValue(item.avg_value, item.metric)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min:</span>
                        <span className="font-medium">
                          {formatValue(item.min_value, item.metric)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max:</span>
                        <span className="font-medium">
                          {formatValue(item.max_value, item.metric)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Std Dev:</span>
                        <span className="font-medium">
                          {item.stddev_value?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limit
                </label>
                <select
                  name="limit"
                  value={filters.limit}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric
                </label>
                <select
                  name="metric"
                  value={filters.metric}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Metrics</option>
                  <option value="vibration">Vibration</option>
                  <option value="oil_level">Oil Level</option>
                  <option value="temperature">Temperature</option>
                  <option value="pressure">Pressure</option>
                  <option value="rpm">RPM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Readings Table */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sensor Readings ({readings.length} entries)
            </h3>
            {readings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {readings.map((reading, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(reading.ts).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {reading.metric.replace("_", " ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatValue(reading.value, reading.metric)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No readings found for the selected filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
