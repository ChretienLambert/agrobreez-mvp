import { machinesAPI } from './api';

const SAMPLE_KEY = 'agrobreez:sample_machines';
let simInterval = null;

const defaultSamples = [
  { id: 1, name: 'Tractor A', status: 'online', computed_status: 'online', last_seen: new Date().toISOString(), metadata: { location: 'Field 1' }, readings: [] },
  { id: 2, name: 'Harvester B', status: 'offline', computed_status: 'offline', last_seen: null, metadata: { location: 'Field 2' }, readings: [] },
  { id: 3, name: 'Irrigation Pump', status: 'warning', computed_status: 'warning', last_seen: new Date(Date.now()-1000*60*30).toISOString(), metadata: { location: 'Greenhouse' }, readings: [] },
];

function loadSamples() {
  try {
    const raw = localStorage.getItem(SAMPLE_KEY);
    if (!raw) {
      localStorage.setItem(SAMPLE_KEY, JSON.stringify(defaultSamples));
      return defaultSamples.slice();
    }
    return JSON.parse(raw);
  } catch (e) {
    return defaultSamples.slice();
  }
}

function saveSamples(list) {
  localStorage.setItem(SAMPLE_KEY, JSON.stringify(list));
}

export async function getAll() {
  // try backend first
  try {
    const resp = await machinesAPI.getAll();
    return resp;
  } catch (e) {
    // fallback to samples
    return { data: { data: loadSamples() } };
  }
}

export async function get(id) {
  try {
    const resp = await machinesAPI.get(id);
    return resp;
  } catch (e) {
    const list = loadSamples();
    return { data: list.find((m) => String(m.id) === String(id)) || null };
  }
}

export function save(machine) {
  const list = loadSamples();
  // assign an id if the machine is new
  if (!machine.id) {
    const maxId = list.reduce((m, it) => Math.max(m, it.id || 0), 0);
    machine.id = maxId + 1;
  }
  const idx = list.findIndex((m) => String(m.id) === String(machine.id));
  if (idx >= 0) list[idx] = { ...list[idx], ...machine };
  else list.push({ ...machine, readings: machine.readings || [], last_seen: machine.last_seen || null });
  saveSamples(list);
  window.dispatchEvent(new Event('machinesUpdated'));
  return { success: true };
}

function randomReading() {
  const metrics = ['vibration', 'temperature', 'pressure', 'rpm', 'oil_level'];
  const metric = metrics[Math.floor(Math.random() * metrics.length)];
  return { metric, value: Math.round(Math.random() * 1000) / 10, ts: new Date().toISOString() };
}

export function startSimulation(intervalMs = 3000) {
  if (simInterval) return;
  simInterval = setInterval(() => {
    const list = loadSamples();
    const now = new Date().toISOString();
    list.forEach((m) => {
      // randomize status
      const r = Math.random();
      if (r < 0.7) m.computed_status = 'online';
      else if (r < 0.9) m.computed_status = 'warning';
      else m.computed_status = 'offline';
      m.last_seen = now;
      // push a reading
      if (!m.readings) m.readings = [];
      m.readings.push(randomReading());
      if (m.readings.length > 50) m.readings.shift();
    });
    saveSamples(list);
    window.dispatchEvent(new Event('machinesUpdated'));
  }, intervalMs);
}

export function stopSimulation() {
  if (!simInterval) return;
  clearInterval(simInterval);
  simInterval = null;
}

export function isSimulating() {
  return !!simInterval;
}

export default { getAll, get, save, startSimulation, stopSimulation, isSimulating };
