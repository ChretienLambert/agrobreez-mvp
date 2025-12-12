import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { isSimulating, startSimulation, stopSimulation } from '../services/machinesService';

function ActiveLink({ to, children }) {
  return (
    <NavLink to={to} className={({ isActive }) => isActive ? 'text-sm text-blue-600 font-medium' : 'text-sm text-gray-600 hover:text-gray-900'}>
      {children}
    </NavLink>
  );
}

export default function NavBar() {
  const navigate = useNavigate();
  const [sim, setSim] = React.useState(isSimulating());
  const [loggedIn, setLoggedIn] = React.useState(!!localStorage.getItem('auth_token'));
  const [userName, setUserName] = React.useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('auth_user'));
      return u?.username || null;
    } catch (e) {
      return null;
    }
  });

  const toggleSim = () => {
    if (isSimulating()) {
      stopSimulation();
      setSim(false);
    } else {
      startSimulation();
      setSim(true);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new Event('authChanged'));
    navigate('/login');
  };

  React.useEffect(() => {
    const onAuth = () => {
      setLoggedIn(!!localStorage.getItem('auth_token'));
      try {
        const u = JSON.parse(localStorage.getItem('auth_user'));
        setUserName(u?.username || null);
      } catch (e) {
        setUserName(null);
      }
    };
    window.addEventListener('authChanged', onAuth);
    return () => window.removeEventListener('authChanged', onAuth);
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-lg font-bold text-gray-900">
              Agrobreez
            </Link>
            <ActiveLink to="/">Dashboard</ActiveLink>
            <ActiveLink to="/machines/new">Add Machine</ActiveLink>
            {!loggedIn && <ActiveLink to="/login">Login</ActiveLink>}
          </div>
          <div>
            <button onClick={toggleSim} className={`mr-3 text-sm px-3 py-1 rounded-md ${sim ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {sim ? 'Stop Simulation' : 'Start Simulation'}
            </button>
            <Link to="/machines/1" className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 mr-3">
              Sample Machine
            </Link>
            {loggedIn ? (
              <>
                <span className="text-sm text-gray-700 mr-3">{userName ? `Hi, ${userName}` : 'Logged in'}</span>
                <button onClick={logout} className="ml-3 text-sm text-gray-600 hover:text-gray-900">Logout</button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
