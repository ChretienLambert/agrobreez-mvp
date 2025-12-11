import React, { useEffect, useState } from "react";
import { machinesAPI, authAPI } from "../services/api";
import MachineDetail from "./MachineDetail";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [user, setUser] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadMachines();
    setUser(authAPI.getCurrentUser());

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadMachines();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadMachines = async () => {
    try {
      const response = await machinesAPI.getAll();
      setMachines(response.data.data);
    } catch (error) {
      console.error("Failed to load machines:", error);
      toast.error("Failed to load machines");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.reload();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "offline":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getComputedStatus = (machine) => {
    return machine.computed_status || machine.status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Agrobreez Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Machine Status Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {machines.map((machine) => (
              <div
                key={machine.id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedMachine(machine.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {machine.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {machine.id}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      getComputedStatus(machine)
                    )}`}
                  >
                    {getComputedStatus(machine)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Seen:</span>
                    <span className="text-gray-900">
                      {machine.last_seen
                        ? new Date(machine.last_seen).toLocaleString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-gray-900 capitalize">
                      {machine.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMachine(machine.id);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {machines.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No machines found</p>
              <p className="text-gray-400 text-sm mt-2">
                Machines will appear here once they start sending telemetry data
              </p>
            </div>
          )}
        </div>

        {/* Status Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {machines.length}
              </div>
              <div className="text-sm text-gray-600">Total Machines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {machines.filter((m) => getComputedStatus(m) === "online").length}
              </div>
              <div className="text-sm text-gray-600">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {machines.filter((m) => getComputedStatus(m) === "warning").length}
              </div>
              <div className="text-sm text-gray-600">Warning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {machines.filter((m) => getComputedStatus(m) === "offline").length}
              </div>
              <div className="text-sm text-gray-600">Offline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Detail Modal */}
      {selectedMachine && (
        <MachineDetail
          machineId={selectedMachine}
          onClose={() => setSelectedMachine(null)}
        />
      )}
    </div>
  );
}
