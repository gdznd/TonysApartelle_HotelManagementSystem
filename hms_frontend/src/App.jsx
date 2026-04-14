import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/dashboard';
import RoomManagement from './components/roommanagement';
import AmenityAssign from './components/amenityassign';
import BedAssign from './components/bedassign';
import SupplyAssign from './components/supplyassign';
import Booking from './components/bookings';
import Payment from './components/payment';
import CheckIn from './components/checkin';
import Services from './components/services';
import CheckOut from './components/checkout';
import UpdatePayment from './components/paymentupdate';
import Inventory from './components/inventory';
import IncomeReport from './components/incomereport';

const NAV_ITEMS = [
  { key: 'dashboard',     label: 'Dashboard',         icon: '🏠', group: 'Overview' },
  { key: 'rooms',         label: 'Room Management',   icon: '🛏️', group: 'Room Config' },
  { key: 'amenities',     label: 'Amenity Assign',    icon: '🪑', group: 'Room Config' },
  { key: 'beds',          label: 'Bed Assign',        icon: '🛌', group: 'Room Config' },
  { key: 'supplies',      label: 'Supply Assign',     icon: '📦', group: 'Room Config' },
  { key: 'booking',       label: 'Booking',           icon: '📋', group: 'Guest Ops' },
  { key: 'checkin',       label: 'Check In',          icon: '✅', group: 'Guest Ops' },
  { key: 'checkout',      label: 'Check Out',         icon: '🚪', group: 'Guest Ops' },
  { key: 'services',      label: 'Service Requests',  icon: '🔧', group: 'Guest Ops' },
  { key: 'payment',       label: 'Payment & Receipt', icon: '💳', group: 'Finance' },
  { key: 'paymentupdate', label: 'Payment Update',    icon: '💰', group: 'Finance' },
  { key: 'inventory',     label: 'Inventory',         icon: '🗂️', group: 'Reports' },
  { key: 'incomereport',  label: 'Income Report',     icon: '📊', group: 'Reports' },
];

const GROUPS = [...new Set(NAV_ITEMS.map(i => i.group))];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeItem = NAV_ITEMS.find(i => i.key === activeTab);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? '230px' : '0px',
        minWidth: sidebarOpen ? '230px' : '0px',
        background: '#1a1f2e',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        boxShadow: sidebarOpen ? '2px 0 8px rgba(0,0,0,0.2)' : 'none',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 12px', borderBottom: '1px solid #2d3448', flexShrink: 0 }}>
          <div style={{ color: '#007bff', fontWeight: 800, fontSize: '20px', whiteSpace: 'nowrap' }}>
            🏨 HotelSys
          </div>
          <div style={{ color: '#6c7a99', fontSize: '11px', marginTop: '3px', whiteSpace: 'nowrap' }}>
            Tony's Apartelle
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0', scrollbarWidth: 'thin' }}>
          {GROUPS.map(group => (
            <div key={group} style={{ marginBottom: '4px' }}>
              <div style={{
                padding: '8px 18px 4px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: '#4a5568',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                {group}
              </div>

              {NAV_ITEMS.filter(i => i.group === group).map(item => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '9px 18px',
                      border: 'none',
                      background: isActive ? '#007bff' : 'transparent',
                      color: isActive ? 'white' : '#a0aec0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      fontWeight: isActive ? 600 : 400,
                      whiteSpace: 'nowrap',
                      transition: 'background 0.15s, color 0.15s',
                      borderLeft: isActive ? '3px solid #66b2ff' : '3px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#2d3448'; e.currentTarget.style.color = 'white'; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a0aec0'; }}}
                  >
                    <span style={{ fontSize: '15px' }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #2d3448', color: '#4a5568', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          SIA2 — S.Y 2025-2026
        </div>
      </aside>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f4f6f9' }}>

        {/* Top bar */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '0 20px',
          height: '52px',
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          flexShrink: 0,
        }}>
          {/* Hamburger button */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'block', width: '20px', height: '2px', background: '#555', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', background: '#555', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', background: '#555', borderRadius: '2px' }} />
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#666' }}>
            <span>HotelSys</span>
            <span style={{ color: '#ccc' }}>›</span>
            <span style={{ color: '#333', fontWeight: 600 }}>
              {activeItem?.icon} {activeItem?.label}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'dashboard'     && <Dashboard />}
          {activeTab === 'rooms'         && <RoomManagement />}
          {activeTab === 'amenities'     && <AmenityAssign />}
          {activeTab === 'beds'          && <BedAssign />}
          {activeTab === 'supplies'      && <SupplyAssign />}
          {activeTab === 'booking'       && <Booking />}
          {activeTab === 'payment'       && <Payment />}
          {activeTab === 'checkin'       && <CheckIn />}
          {activeTab === 'services'      && <Services />}
          {activeTab === 'checkout'      && <CheckOut />}
          {activeTab === 'paymentupdate' && <UpdatePayment />}
          {activeTab === 'inventory'     && <Inventory />}
          {activeTab === 'incomereport'  && <IncomeReport />}
        </main>
      </div>
    </div>
  );
}

export default App;
