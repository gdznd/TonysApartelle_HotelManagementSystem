import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AmenityAssign() {
  const [rooms, setRooms] = useState([]);
  const [catalog, setCatalog] = useState([]); // The Menu of options
  const [roomAmenities, setRoomAmenities] = useState([]); // Assigned to room
  
  const [selectedRoomId, setSelectedRoomId] = useState('');
  
  // Form for creating a new Amenity type
  const [newAmenity, setNewAmenity] = useState({ name: '', price: 0, type: 'Fixed' });

  // 1. Initial Load
  useEffect(() => {
    fetchRooms();
    fetchCatalog();
  }, []);

  // 2. Fetch Room Contents when Selection Changes
  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomAmenities(selectedRoomId);
    }
  }, [selectedRoomId]);

  const fetchRooms = () => {
    axios.get('http://127.0.0.1:5000/api/rooms').then(res => {
        setRooms(res.data);
        if (res.data.length > 0) setSelectedRoomId(res.data[0].id);
    });
  };

  const fetchCatalog = () => {
    axios.get('http://127.0.0.1:5000/api/amenities').then(res => setCatalog(res.data));
  };

  const fetchRoomAmenities = (id) => {
    axios.get(`http://127.0.0.1:5000/api/rooms/${id}/amenities`)
      .then(res => setRoomAmenities(res.data));
  };

  // --- ACTIONS ---

  const handleAssign = (amenityId) => {
    if (!selectedRoomId) return;
    axios.post('http://127.0.0.1:5000/api/rooms/assign-amenity', {
        room_id: selectedRoomId,
        amenity_id: amenityId
    }).then(() => fetchRoomAmenities(selectedRoomId));
  };

  const handleRemove = (id) => {
    axios.delete(`http://127.0.0.1:5000/api/room-amenities/${id}`)
        .then(() => fetchRoomAmenities(selectedRoomId));
  };

  const handleCreateAmenity = (e) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:5000/api/amenities', newAmenity)
        .then(() => {
            fetchCatalog();
            setNewAmenity({ name: '', price: 0, type: 'Fixed' });
        });
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <h2 style={{ marginBottom: '20px' }}>Module 2: Amenity Assignment</h2>
      
      {/* --- TOP SECTION: FULL WIDTH ROOM SELECTION (Red Streak) --- */}
      <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          background: 'white', 
          padding: '20px 25px', 
          borderRadius: '8px', 
          borderLeft: '6px solid #dc3545', // Dark Red Streak
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          marginBottom: '25px'
      }}>
        <label style={{ fontWeight: 'bold', color: '#333', fontSize: '18px', whiteSpace: 'nowrap' }}>
          Select Room:
        </label>
        <select 
          style={{ width: '100%', maxWidth: '400px', padding: '10px 15px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: '#f9f9f9', cursor: 'pointer' }} 
          value={selectedRoomId} 
          onChange={(e) => setSelectedRoomId(e.target.value)}
        >
          {rooms.map(r => (
              <option key={r.id} value={r.id}>Room {r.room_number} ({r.room_type})</option>
          ))}
        </select>
      </div>

      {/* --- BOTTOM SECTION: 2 COLUMNS --- */}
      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: AMENITY CATALOG (Click to Add) */}
        <div style={{ flex: '1', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, color: '#dc3545' }}>Assign Amenity</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Click an item below to instantly add it to the selected room.
          </p>

          {/* Grid of Clickable Amenity Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '30px' }}>
            {catalog.map(item => (
                <button 
                    key={item.id}
                    onClick={() => handleAssign(item.id)}
                    style={{ 
                        padding: '12px', 
                        background: 'white', 
                        border: '1px solid #ced4da', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#444',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#dc3545'; e.currentTarget.style.color = '#dc3545'; e.currentTarget.style.background = '#fff5f5'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#ced4da'; e.currentTarget.style.color = '#444'; e.currentTarget.style.background = 'white'; }}
                >
                    {item.name}
                    <div style={{ fontSize: '11px', fontWeight: 'normal', marginTop: '5px', color: '#777' }}>₱{item.price}</div>
                </button>
            ))}
          </div>

          {/* Mini Form to Create New Amenity */}
          <div style={{ borderTop: '2px solid #e9ecef', paddingTop: '20px' }}>
            <h4 style={{ color: '#555', marginTop: 0 }}>Add New Item to Catalog</h4>
            <form onSubmit={handleCreateAmenity} style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" placeholder="Name (e.g. Slippers)" 
                        value={newAmenity.name}
                        onChange={(e) => setNewAmenity({...newAmenity, name: e.target.value})}
                        style={{ flex: 2, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        required
                    />
                    <input 
                        type="number" placeholder="Price" 
                        value={newAmenity.price}
                        onChange={(e) => setNewAmenity({...newAmenity, price: e.target.value})}
                        style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px', background: '#343a40', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Save to Catalog
                </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: CURRENT AMENITIES TABLE */}
        <div style={{ flex: '2', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#dc3545' }}>Current Amenities in Room</h3>
          
          {roomAmenities.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                No amenities assigned to this room yet.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={thStyle}>Amenity Name</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Quantity</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {roomAmenities.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{...tdStyle, fontWeight: '500'}}>{item.name}</td>
                      <td style={tdStyle}>
                        <span style={{ 
                            background: '#e9ecef', color: '#495057', 
                            padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' 
                        }}>
                            {item.type}
                        </span>
                      </td>
                      <td style={tdStyle}>₱{Number(item.price).toFixed(2)}</td>
                      <td style={{...tdStyle, fontWeight: 'bold', fontSize: '15px', color: '#dc3545'}}>
                          {item.quantity}
                      </td>
                      <td style={tdStyle}>
                        <button 
                            onClick={() => handleRemove(item.id)}
                            style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                            Remove
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

// --- Styles ---
const thStyle = { padding: '12px', textAlign: 'left', color: '#495057', fontSize: '14px' };
const tdStyle = { padding: '12px', verticalAlign: 'middle', color: '#333' };