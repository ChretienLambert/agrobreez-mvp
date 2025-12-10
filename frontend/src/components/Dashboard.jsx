import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    async function load() {
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const r = await axios.get(`${base}/api/machines`);
      setMachines(r.data);
    }
    load();
  }, []);

  return (
    <div>
      <h2 className="text-xl">Machines</h2>
      <ul>
        {machines.map((m) => (
          <li key={m.id} className="p-2 border rounded mb-2">
            {m.name} — {m.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
