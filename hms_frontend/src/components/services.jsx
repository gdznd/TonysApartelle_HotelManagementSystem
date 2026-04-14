import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:5000';

const getStaffOptions = (type) => {
    switch (type) {
        case 'Housekeeping':     return ['Ana (Housekeeping)', 'Maria (Housekeeping)'];
        case 'Maintenance':      return ['John (Maintenance)', 'Carlo (Maintenance)'];
        case 'Room Service':     return ['Chef Mario (Kitchen)', 'Chef Rosa (Kitchen)'];
        case 'Amenities':        return ['Front Desk', 'Ana (Housekeeping)'];
        case 'Technical Support':return ['John (Maintenance)', 'IT Support'];
        default:                 return ['Front Desk'];
    }
};

export default function Services() {
    const [activeGuests, setActiveGuests] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        booking_id: '', room_id: '', room_number: '', guest_name: '',
        request_type: 'Housekeeping',
        description: '',
        service_charge: 0,
        staff_name: 'Ana (Housekeeping)'
    });

    const [roomFlags, setRoomFlags] = useState({});

    useEffect(() => { fetchGuests(); fetchRequests(); }, []);

    const fetchGuests = () => {
        axios.get(`${API}/api/services/guests`)
            .then(res => setActiveGuests(res.data))
            .catch(err => console.error(err));
    };

    const fetchRequests = () => {
        setLoading(true);
        axios.get(`${API}/api/services/list`)
            .then(res => setRequests(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const filteredGuests = activeGuests.filter(g => {
        const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
        const roomNum = g.room_number.toString();
        const ref = g.booking_reference?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || roomNum.includes(search) || ref.includes(search);
    });

    const handleSelectGuest = (guest) => {
        setFormData(prev => ({
            ...prev,
            booking_id: guest.booking_id,
            room_id: guest.room_id || '',
            room_number: guest.room_number,
            guest_name: `${guest.first_name} ${guest.last_name}`
        }));
        setSearchTerm(`${guest.first_name} ${guest.last_name} (Room ${guest.room_number})`);
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setFormData(prev => ({
            ...prev,
            request_type: newType,
            staff_name: getStaffOptions(newType)[0]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.booking_id) return alert('Please select an active guest.');

        const flags = roomFlags[formData.room_id] || {};
        if (flags.dnd) {
            const ok = window.confirm(`⚠️ Room ${formData.room_number} is set to Do Not Disturb.\nAre you sure you want to log this request?`);
            if (!ok) return;
        }

        setSubmitting(true);
        axios.post(`${API}/api/services/create`, {
            booking_id: formData.booking_id,
            request_type: formData.request_type,
            description: formData.description,
            service_charge: parseFloat(formData.service_charge) || 0,
            staff_name: formData.staff_name
        })
        .then(() => {
            alert('✅ Service request logged!');
            fetchRequests();
            setFormData(prev => ({ ...prev, description: '', service_charge: 0, booking_id: '', guest_name: '' }));
            setSearchTerm('');
        })
        .catch(err => { console.error(err); alert('Error logging request.'); })
        .finally(() => setSubmitting(false));
    };

    const cycleStatus = (id, currentStatus) => {
        const next = currentStatus === 'Pending' ? 'In Progress' : 'Completed';
        axios.put(`${API}/api/services/update-status/${id}`, { status: next })
            .then(() => fetchRequests())
            .catch(err => console.error(err));
    };

    const handleDelete = (id) => {
        if (!window.confirm('Delete this completed request?')) return;
        axios.delete(`${API}/api/services/delete/${id}`)
            .then(() => fetchRequests())
            .catch(err => console.error(err));
    };

    const handleRoomToggle = (roomId, flag, currentValue) => {
        if (!roomId) return alert('Select a guest/room first.');
        axios.put(`${API}/api/rooms/${roomId}/flags`, { [flag]: !currentValue })
            .then(() => {
                setRoomFlags(prev => ({
                    ...prev,
                    [roomId]: { ...(prev[roomId] || {}), [flag]: !currentValue }
                }));
            })
            .catch(() => alert('Could not update room flag.'));
    };

    const pendingCount = requests.filter(r => r.status === 'Pending').length;
    const inProgressCount = requests.filter(r => r.status === 'In Progress').length;
    const totalCharges = requests.reduce((s, r) => s + parseFloat(r.service_charge || 0), 0);
    const currentFlags = roomFlags[formData.room_id] || { dnd: false, mur: false };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
            <h2 style={{ color: '#333', marginBottom: '4px' }}>Module 8: Services & Requests</h2>
            <p style={{ color: '#888', fontSize: '13px', marginTop: 0, marginBottom: '20px' }}>
                Log guest service requests. Charges are added to the guest's payment balance.
            </p>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <StatCard label="Pending" value={pendingCount} color="#ffc107" />
                <StatCard label="In Progress" value={inProgressCount} color="#007bff" />
                <StatCard label="Active Guests" value={activeGuests.length} color="#28a745" />
                <StatCard label="Total Charges" value={`₱${totalCharges.toLocaleString()}`} color="#dc3545" />
            </div>

            <div style={cardStyle}>
                <h3 style={headerBlue}>Log New Request</h3>
                <form onSubmit={handleSubmit} style={gridStyle}>
                    
                    <div style={{ gridColumn: 'span 2', position: 'relative' }}>
                        <label style={labelStyle}>Search Active Guest / Room *</label>
                        <input
                            type="text"
                            style={inputStyle}
                            placeholder="Type name or room number..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (formData.booking_id) setFormData(p => ({ ...p, booking_id: '', guest_name: '' }));
                            }}
                        />
                        
                        {searchTerm && !formData.booking_id && (
                            <div style={dropdownStyle}>
                                {filteredGuests.length > 0 ? filteredGuests.map(g => (
                                    <div 
                                        key={g.booking_id}
                                        onClick={() => handleSelectGuest(g)}
                                        style={dropdownItemStyle}
                                        onMouseEnter={(e) => e.target.style.background = '#f0f7ff'}
                                        onMouseLeave={(e) => e.target.style.background = 'white'}
                                    >
                                        <strong>Room {g.room_number}</strong> — {g.first_name} {g.last_name}
                                    </div>
                                )) : <div style={{ padding: '10px', color: '#999' }}>No guests found</div>}
                            </div>
                        )}

                        {formData.guest_name && (
                            <span style={{ fontSize: '12px', color: '#28a745', marginTop: '4px', display: 'block' }}>
                                ✓ {formData.guest_name} — Room {formData.room_number}
                                {currentFlags.dnd && <span style={{ marginLeft: '10px', color: '#dc3545', fontWeight: 'bold' }}>🚫 DND</span>}
                                {currentFlags.mur && <span style={{ marginLeft: '6px', color: '#28a745', fontWeight: 'bold' }}>🧹 MUR</span>}
                            </span>
                        )}
                    </div>

                    <div>
                        <label style={labelStyle}>Request Type</label>
                        <select style={inputStyle} value={formData.request_type} onChange={handleTypeChange}>
                            <option>Housekeeping</option>
                            <option>Maintenance</option>
                            <option>Room Service</option>
                            <option>Amenities</option>
                            <option>Technical Support</option>
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Charge Amount (₱)</label>
                        <input
                            type="number" min="0" step="0.01"
                            style={inputStyle}
                            value={formData.service_charge}
                            onChange={e => setFormData({ ...formData, service_charge: e.target.value })}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Specific Description</label>
                        <input
                            placeholder="e.g., Extra Blanket, Aircon Leaking..."
                            style={inputStyle}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Assigned Staff</label>
                        <select
                            style={inputStyle}
                            value={formData.staff_name}
                            onChange={e => setFormData({ ...formData, staff_name: e.target.value })}
                        >
                            {getStaffOptions(formData.request_type).map(s => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                        <label style={{ ...labelStyle, marginBottom: '12px' }}>Room Status Toggles</label>
                        <div style={{ display: 'flex', gap: '40px' }}>
                            <Toggle
                                label="🚫 Do Not Disturb"
                                active={currentFlags.dnd}
                                activeColor="#dc3545"
                                disabled={!formData.room_id}
                                onToggle={() => handleRoomToggle(formData.room_id, 'dnd', currentFlags.dnd)}
                            />
                            <Toggle
                                label="🧹 Make Up Room"
                                active={currentFlags.mur}
                                activeColor="#28a745"
                                disabled={!formData.room_id}
                                onToggle={() => handleRoomToggle(formData.room_id, 'mur', currentFlags.mur)}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={submitting} style={{ ...btnBlue, opacity: submitting ? 0.7 : 1 }}>
                        {submitting ? 'Logging...' : '📋 Log Request'}
                    </button>
                </form>
            </div>

            <h3 style={{ marginTop: '40px', color: '#333' }}>
                All Service Requests
                {pendingCount > 0 && <span style={badgeRed}>{pendingCount} Pending</span>}
            </h3>

            {loading ? <p>Loading...</p> : (
                <div style={tableContainerStyle}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead style={{ background: '#343a40', color: 'white' }}>
                            <tr>
                                {['Booking Ref','Room','Guest','Type','Description','Charge','Staff','Status','Action'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #eee', background: r.status === 'Completed' ? '#f8f9fa' : 'white' }}>
                                    <td style={{ ...tdStyle, color: '#007bff', fontWeight: 'bold' }}>{r.booking_reference}</td>
                                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{r.room_number}</td>
                                    <td style={tdStyle}>{r.guest_name}</td>
                                    <td style={tdStyle}><TypeBadge type={r.request_type} /></td>
                                    <td style={tdStyle}>{r.description || '—'}</td>
                                    <td style={{ ...tdStyle, fontWeight: 'bold', color: parseFloat(r.service_charge) > 0 ? '#dc3545' : '#aaa' }}>
                                        {parseFloat(r.service_charge) > 0 ? `₱${parseFloat(r.service_charge).toLocaleString()}` : '—'}
                                    </td>
                                    <td style={tdStyle}>{r.staff_name}</td>
                                    <td style={tdStyle}><StatusBadge status={r.status} /></td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {r.status !== 'Completed' && (
                                                <button onClick={() => cycleStatus(r.id, r.status)} style={{ background: r.status === 'Pending' ? '#007bff' : '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                                    {r.status === 'Pending' ? '▶ Process' : '✓ Complete'}
                                                </button>
                                            )}
                                            {r.status === 'Completed' && (
                                                <button onClick={() => handleDelete(r.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>🗑 Delete</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div style={{ background: 'white', border: `3px solid ${color}`, borderRadius: '8px', padding: '14px 22px', minWidth: '150px' }}>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#777' }}>{label}</div>
        </div>
    );
}

function Toggle({ label, active, activeColor, disabled, onToggle }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: disabled ? 0.4 : 1 }}>
            <span style={{ fontSize: '14px', color: '#555', minWidth: '130px' }}>{label}</span>
            <div onClick={disabled ? null : onToggle} style={{ width: '48px', height: '26px', borderRadius: '13px', cursor: disabled ? 'not-allowed' : 'pointer', background: active ? activeColor : '#ccc', position: 'relative' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: active ? '25px' : '3px', transition: '0.2s' }} />
            </div>
        </div>
    );
}

function TypeBadge({ type }) {
    const colors = { 'Housekeeping': { bg: '#e3f2fd', color: '#1565c0' }, 'Maintenance': { bg: '#fff3e0', color: '#e65100' }, 'Room Service': { bg: '#e8f5e9', color: '#2e7d32' } };
    const c = colors[type] || { bg: '#f0f0f0', color: '#333' };
    return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: c.bg, color: c.color }}>{type}</span>;
}

function StatusBadge({ status }) {
    const map = { 'Pending': { bg: '#ffc107', color: '#333' }, 'In Progress': { bg: '#007bff', color: 'white' }, 'Completed': { bg: '#28a745', color: 'white' } };
    const s = map[status] || { bg: '#eee', color: '#333' };
    return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: s.bg, color: s.color }}>{status}</span>;
}

const cardStyle = { background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0', maxWidth: '900px' };
const headerBlue = { color: '#007bff', marginTop: 0 };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '20px', rowGap: '15px' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' };
const btnBlue = { gridColumn: 'span 2', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };
const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: '12px' };
const tdStyle = { padding: '10px 12px', fontSize: '14px' };
const badgeRed = { marginLeft: '10px', background: '#dc3545', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '12px' };
const dropdownStyle = { position: 'absolute', zIndex: 10, background: 'white', width: '100%', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };
const dropdownItemStyle = { padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '14px' };
const tableContainerStyle = { background: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'auto' };