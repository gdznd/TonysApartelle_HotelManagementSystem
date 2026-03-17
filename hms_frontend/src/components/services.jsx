import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Commented out for Frontend-First testing

export default function Services() {
    // --- STATE ---
    const [activeGuests, setActiveGuests] = useState([]); // Only guests currently in-house
    const [requests, setRequests] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        booking_id: '',
        room_number: '', // Hidden field, auto-filled based on selection
        guest_name: '',  // Hidden field
        request_type: 'Housekeeping',
        description: '',
        service_charge: 0,
        staff_name: 'Ana (Housekeeping)'
    });

    // --- 1. MOCK DATA LOADER (Simulate Backend) ---
    useEffect(() => {
        // Simulating: axios.get('/api/checkins/active')
        const mockActiveGuests = [
            { booking_id: 'BK-02182026-0001', room_number: '101', guest_name: 'Jane Smith' },
            { booking_id: 'BK-02172026-0042', room_number: '205', guest_name: 'Michael Scott' },
            { booking_id: 'BK-02182026-0003', room_number: '104', guest_name: 'Jim Halpert' }
        ];
        setActiveGuests(mockActiveGuests);

        // Simulating: axios.get('/api/services/active')
        // Only loading requests for people currently checked in
        const mockRequests = [
            { 
                id: 1, 
                booking_id: 'BK-02172026-0042', 
                room_number: '205', 
                guest_name: 'Michael Scott',
                request_type: 'Room Service', 
                description: 'Cheeseburger & Fries', 
                service_charge: 450, 
                staff_name: 'Chef Mario', 
                status: 'Pending' 
            },
            { 
                id: 2, 
                booking_id: 'BK-02182026-0001', 
                room_number: '101', 
                guest_name: 'Jane Smith',
                request_type: 'Housekeeping', 
                description: 'Extra Towels', 
                service_charge: 0, 
                staff_name: 'Ana', 
                status: 'Completed' 
            }
        ];
        setRequests(mockRequests);
    }, []);

    // --- HANDLERS ---
    
    // When dropdown changes, find the guest details and fill them in
    const handleGuestSelect = (e) => {
        const selectedId = e.target.value;
        const guest = activeGuests.find(g => g.booking_id === selectedId);
        
        if (guest) {
            setFormData({
                ...formData,
                booking_id: selectedId,
                room_number: guest.room_number,
                guest_name: guest.guest_name
            });
        } else {
            setFormData({ ...formData, booking_id: '' });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.booking_id) return alert("Please select a guest/room.");

        // Simulate creating a new request
        const newRequest = {
            id: Date.now(), // Random ID
            ...formData,
            status: 'Pending'
        };

        // Update UI immediately
        setRequests([newRequest, ...requests]);
        alert("✅ Service Request Logged!");
        
        // Reset description/charge but keep the guest selected (convenience)
        setFormData(prev => ({ 
            ...prev, 
            description: '', 
            service_charge: 0 
        }));
    };

    const markComplete = (id) => {
        // Simulate Update
        const updatedList = requests.map(r => 
            r.id === id ? { ...r, status: 'Completed' } : r
        );
        setRequests(updatedList);
    };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
            <h2 style={{ color: '#333' }}>Module 8: Services & Requests</h2>

            {/* --- TOP SECTION: LOG NEW REQUEST --- */}
            <div style={cardStyle}>
                <h3 style={headerBlue}>Log New Request</h3>
                <form onSubmit={handleSubmit} style={gridStyle}>
                    
                    {/* Select Guest (Only Active Check-ins) */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Select Active Guest / Room</label>
                        <select 
                            style={inputStyle} 
                            value={formData.booking_id}
                            onChange={handleGuestSelect}
                        >
                            <option value="">-- Choose from In-House Guests --</option>
                            {activeGuests.map(g => (
                                <option key={g.booking_id} value={g.booking_id}>
                                    Room {g.room_number} - {g.guest_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Request Type */}
                    <div>
                        <label style={labelStyle}>Request Type</label>
                        <select 
                            style={inputStyle}
                            value={formData.request_type}
                            onChange={(e) => setFormData({...formData, request_type: e.target.value})}
                        >
                            <option>Housekeeping</option>
                            <option>Maintenance</option>
                            <option>Room Service</option>
                            <option>Amenities</option>
                            <option>Technical Support</option>
                        </select>
                    </div>

                    {/* Service Charge */}
                    <div>
                        <label style={labelStyle}>Charge Amount (₱)</label>
                        <input 
                            type="number" 
                            style={inputStyle}
                            placeholder="0.00"
                            value={formData.service_charge}
                            onChange={(e) => setFormData({...formData, service_charge: e.target.value})}
                        />
                    </div>

                    {/* Description */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Specific Description</label>
                        <input 
                            placeholder="e.g., Extra Blanket, Aircon Leaking, Burger & Fries..." 
                            style={inputStyle}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    {/* Staff Assignment */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Assigned Staff</label>
                        <select 
                            style={inputStyle}
                            value={formData.staff_name}
                            onChange={(e) => setFormData({...formData, staff_name: e.target.value})}
                        >
                            <option>Ana (Housekeeping)</option>
                            <option>John (Maintenance)</option>
                            <option>Chef Mario (Kitchen)</option>
                            <option>Front Desk</option>
                        </select>
                    </div>

                    <button type="submit" style={btnBlue}>Log Request</button>
                </form>
            </div>

            {/* --- BOTTOM SECTION: REQUESTS TABLE --- */}
            <h3 style={{ marginTop: '40px', color: '#333' }}>Active Guest Requests</h3>
            <div style={{ background: 'white', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#343a40', color: 'white' }}>
                        <tr>
                            {/* 1. New ID Column */}
                            <th style={thStyle}>Booking ID</th>
                            <th style={thStyle}>Room</th>
                            <th style={thStyle}>Type</th>
                            <th style={thStyle}>Description</th>
                            {/* 2. New Charge Column */}
                            <th style={thStyle}>Charge</th>
                            <th style={thStyle}>Assigned To</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #eee', background: r.status === 'Completed' ? '#f9f9f9' : 'white' }}>
                                {/* Booking ID */}
                                <td style={{...tdStyle, fontSize:'12px', color:'#666'}}>{r.booking_id}</td>
                                
                                <td style={tdStyle}><strong>{r.room_number}</strong></td>
                                <td style={tdStyle}>{r.request_type}</td>
                                <td style={tdStyle}>{r.description}</td>
                                
                                {/* Charge Column */}
                                <td style={{...tdStyle, color: r.service_charge > 0 ? '#c40000' : '#666', fontWeight: 'bold'}}>
                                    {r.service_charge > 0 ? `₱${r.service_charge}` : '-'}
                                </td>

                                <td style={tdStyle}>{r.staff_name}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                        background: r.status === 'Pending' ? '#ffc107' : '#28a745',
                                        color: r.status === 'Pending' ? '#333' : 'white'
                                    }}>
                                        {r.status}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    {r.status !== 'Completed' && (
                                        <button 
                                            onClick={() => markComplete(r.id)}
                                            style={{ ...btnSmall, color: '#007bff' }}
                                        >
                                            Mark Complete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No active requests.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- STYLES ---
const cardStyle = {
    background: 'white',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    maxWidth: '800px'
};

const headerBlue = { color: '#007bff', marginTop: 0, marginBottom: '20px' };

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '20px',
    rowGap: '15px'
};

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' };

const inputStyle = {
    width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box'
};

const btnBlue = {
    gridColumn: 'span 2',
    marginTop: '10px',
    padding: '12px',
    background: '#007bff', color: 'white',
    border: 'none', borderRadius: '4px',
    fontWeight: 'bold', cursor: 'pointer', fontSize: '15px'
};

const thStyle = { padding: '12px', textAlign: 'left', fontSize: '13px' };
const tdStyle = { padding: '12px', textAlign: 'left', fontSize: '14px', color: '#333' };
const btnSmall = { background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 };