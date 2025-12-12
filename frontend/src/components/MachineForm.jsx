import React, { useState } from 'react';
import machinesService from '../services/machinesService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MachineForm() {
  const [machine, setMachine] = useState({ name: '', metadata: { location: '' }, status: 'online' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'location') setMachine((m) => ({ ...m, metadata: { ...(m.metadata || {}), location: value } }));
    else setMachine((m) => ({ ...m, [name]: value }));
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const toSave = { ...machine, last_seen: now, readings: machine.readings || [] };
    const resp = machinesService.save(toSave);
    toast.success('Machine saved');
    navigate(`/machines/${toSave.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10">
      <div className="max-w-2xl w-full bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Create Sample Machine</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input name="name" value={machine.name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Location</label>
            <input name="location" value={machine.metadata?.location || ''} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select name="status" value={machine.status} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="online">Online</option>
              <option value="warning">Warning</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
