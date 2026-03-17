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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      <nav className="navbar">
        <h2 style={{ color: '#007bff', marginRight: '20px' }}>HotelSys</h2>
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'nav-btn active' : 'nav-btn'}>Dashboard</button>
        <button onClick={() => setActiveTab('rooms')} className={activeTab === 'rooms' ? 'nav-btn active' : 'nav-btn'}>Room Mgt</button>
        <button onClick={() => setActiveTab('amenities')} className={activeTab === 'amenities' ? 'nav-btn active' : 'nav-btn'}>Amenity Assign</button>
        <button onClick={() => setActiveTab('beds')} className={activeTab === 'beds' ? 'nav-btn active' : 'nav-btn'}>Bed Assign</button>
        <button onClick={() => setActiveTab('supplies')} className={activeTab === 'supplies' ? 'nav-btn active' : 'nav-btn'}>Supply Assign</button>
        <button onClick={() => setActiveTab('booking')} className={activeTab === 'booking' ? 'nav-btn active' : 'nav-btn'}>Booking</button>
        <button onClick={() => setActiveTab('payment')} className={activeTab === 'payment' ? 'nav-btn active' : 'nav-btn'}>Payment</button>
        <button onClick={() => setActiveTab('checkin')} className={activeTab === 'checkin' ? 'nav-btn active' : 'nav-btn'}>Check Ins</button>
        <button onClick={() => setActiveTab('services')} className={activeTab === 'services' ? 'nav-btn active' : 'nav-btn'}>Service Requests</button>
        <button onClick={() => setActiveTab('checkout')} className={activeTab === 'checkout' ? 'nav-btn active' : 'nav-btn'}>Check Outs</button>
        <button onClick={() => setActiveTab('paymentupdate')} className={activeTab === 'paymentupdate' ? 'nav-btn active' : 'nav-btn'}>Pay Update</button>
        <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'nav-btn active' : 'nav-btn'}>Inventory</button>
        <button onClick={() => setActiveTab('incomereport')} className={activeTab === 'incomereport' ? 'nav-btn active' : 'nav-btn'}>Income Report</button>
      </nav>

      <main>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'rooms' && <RoomManagement />}
        {activeTab === 'amenities' && <AmenityAssign />}
        {activeTab === 'beds' && <BedAssign />}
        {activeTab === 'supplies' && <SupplyAssign />}
        {activeTab === 'booking' && <Booking />}
        {activeTab === 'payment' && <Payment />}
        {activeTab === 'checkin' && <CheckIn />}
        {activeTab === 'services' && <Services />}
        {activeTab === 'checkout' && <CheckOut />}
        {activeTab === 'paymentupdate' && <UpdatePayment />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'incomereport' && <IncomeReport />}
      </main>
    </div>
  );
}

export default App;