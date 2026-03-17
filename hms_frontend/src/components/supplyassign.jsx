import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SupplyAssign() {
  const [rooms, setRooms] = useState([]);
  const [supplyCatalog, setSupplyCatalog] = useState([]); 
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [currentSupplies, setCurrentSupplies] = useState([]); 

  // Form Data
  const [formData, setFormData] = useState({
    supply_id: '',
    quantity: 1
  });

  // 1. Initial Load
  useEffect(() => {
    // Fetch Rooms
    axios.get('http://127.0.0.1:5000/api/rooms').then(res => {
      setRooms(res.data);
      if (res.data.length > 0) setSelectedRoomId(res.data[0].id);
    });

    // Fetch Supply Catalog
    axios.get('http://127.0.0.1:5000/api/supplies').then(res => {
      setSupplyCatalog(res.data);
      if (res.data.length > 0) setFormData(prev => ({ ...prev, supply_id: res.data[0].id }));
    });
  }, []);

  // 2. Fetch Room Items
  useEffect(() => {
    if (selectedRoomId) fetchRoomSupplies(selectedRoomId);
  }, [selectedRoomId]);

  const fetchRoomSupplies = (roomId) => {
    axios.get(`http://127.0.0.1:5000/api/rooms/${roomId}/supplies`)
      .then(res => setCurrentSupplies(res.data));
  };

  // --- ACTIONS ---
  const handleAssign = (e) => {
    e.preventDefault();
    if (!selectedRoomId || !formData.supply_id) return;

    axios.post('http://127.0.0.1:5000/api/rooms/assign-supply', {
      room_id: selectedRoomId,
      ...formData
    }).then(() => {
      fetchRoomSupplies(selectedRoomId);
      setFormData(prev => ({ ...prev, quantity: 1 })); // Reset quantity
    });
  };

  const handleDelete = (id) => {
    axios.delete(`http://127.0.0.1:5000/api/room-supplies/${id}`)
      .then(() => fetchRoomSupplies(selectedRoomId));
  };

  // --- HELPER FOR STATUS BADGES ---
  const getStatusBadge = (status) => {
    switch(status) {
        case 'In Stock': return { bg: '#d4edda', color: '#155724' };
        case 'Low Stock': return { bg: '#fff3cd', color: '#856404' };
        case 'Unavailable': return { bg: '#f8d7da', color: '#721c24' };
        default: return { bg: '#e2e3e5', color: '#383d41' };
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <h2 style={{ marginBottom: '15px', fontSize: '22px' }}>Module 4: Supply Assignment</h2>
      
      {/* --- TOP SECTION: FULL WIDTH ROOM SELECTION --- */}
      <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          background: 'white', 
          padding: '15px 20px', 
          borderRadius: '6px', 
          borderLeft: '5px solid #28a745', // Green streak
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          marginBottom: '20px'
      }}>
        <label style={{ fontWeight: 'bold', color: '#333', fontSize: '14px', whiteSpace: 'nowrap' }}>
          Select Room:
        </label>
        <select 
          style={{ width: '100%', maxWidth: '350px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', backgroundColor: '#f9f9f9', cursor: 'pointer' }} 
          value={selectedRoomId} 
          onChange={(e) => setSelectedRoomId(e.target.value)}
        >
          {rooms.map(r => (
            <option key={r.id} value={r.id}>Room {r.room_number} ({r.room_type})</option>
          ))}
        </select>
      </div>

      {/* --- BOTTOM SECTION: 2 COLUMNS (FORM & TABLE) --- */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: ADD SUPPLY FORM */}
        <div style={{ flex: '1', background: '#f8f9fa', padding: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', color: '#28a745' }}>Add Supply</h3>
          
          <form onSubmit={handleAssign}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', fontSize: '12px', color: '#444' }}>Supply Item:</label>
              <select 
                style={inputStyle}
                value={formData.supply_id}
                onChange={(e) => setFormData({...formData, supply_id: e.target.value})}
              >
                {supplyCatalog.map(item => (
                  <option key={item.id} value={item.id} disabled={item.status === 'Unavailable'}>
                    {item.name} (₱{item.cost}) {item.status === 'Unavailable' ? '- Unavailable' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', fontSize: '12px', color: '#444' }}>Quantity:</label>
              <input 
                type="number" min="1" style={inputStyle}
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>

            <button type="submit" style={addBtnStyle}>➕ Add Quantity</button>
          </form>
        </div>

        {/* RIGHT COLUMN: CURRENT SUPPLIES TABLE */}
        <div style={{ flex: '2', background: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', color: '#28a745' }}>Current Supplies in Room</h3>
          
          {currentSupplies.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', padding: '15px', fontSize: '13px', textAlign: 'center' }}>
                No supplies tracked for this room yet.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Supply Name</th>
                  <th style={thStyle}>Status (Global)</th>
                  <th style={thStyle}>Cost</th>
                  <th style={thStyle}>Quantity</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSupplies.map(item => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>#{item.id}</td>
                      <td style={tdStyle}>{item.name}</td>
                      <td style={tdStyle}>
                        <span style={{ 
                          padding: '3px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                          background: badge.bg, color: badge.color 
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={tdStyle}>₱{item.cost}</td>
                      <td style={{...tdStyle, fontWeight: 'bold'}}>{item.quantity}</td>
                      <td style={tdStyle}>
                        <button onClick={() => handleDelete(item.id)} style={deleteBtnStyle}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

// Scaled down Styles (approx -20%)
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' };
const addBtnStyle = { width: '100%', marginTop: '8px', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const thStyle = { padding: '8px', borderBottom: '2px solid #ddd', textAlign: 'left', color: '#333', fontSize: '13px' };
const tdStyle = { padding: '8px', color: '#555', fontSize: '13px' };
const deleteBtnStyle = { background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' };