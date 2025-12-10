import React from "react";
import Dashboard from "./components/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen font-sans p-4">
      <h1 className="text-2xl mb-4">Agrobreez — Predictive Maintenance</h1>
      <Dashboard />
    </div>
  );
}
