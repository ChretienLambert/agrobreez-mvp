import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import MachineDetail from "./components/MachineDetail";
import MachineForm from "./components/MachineForm";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/machines/new" element={<ProtectedRoute><MachineForm /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/machines/:id" element={<ProtectedRoute><MachineDetail /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
