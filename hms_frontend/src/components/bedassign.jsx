import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function BedAssign() {
  const [rooms, setRooms] = useState([]);
  const [bedTypes, setBedTypes] = useState([]); // The Catalog
  const [selectedRoomId, setSelectedRoomId] = useState('');
  
  // The List of Beds currently in the selected room
  const [currentBeds, setCurrentBeds] = useState([]);

  // Form Data for adding a new bed
  const [formData, setFormData] = useState({
    bed_id: '',
    count: 1,
    allow_extra: false,
    allow_rearrange: false
  });

  // 1. Initial Load: Rooms and Bed Types
  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/rooms').then(res => {
      setRooms(res.data);
      if (res.data.length > 0) setSelectedRoomId(res.data[0].id);
    });

    axios.get('http://127.0.0.1:5000/api/beds').then(res => {
      setBedTypes(res.data);
      if (res.data.length > 0) setFormData(prev => ({ ...prev, bed_id: res.data[0].id }));
    });
  }, []);

  // 2. Fetch Assigned Beds when Room Changes
  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomBeds();
    }
  }, [selectedRoomId]);

  const fetchRoomBeds = () => {
    axios.get(`http://127.0.0.1:5000/api/rooms/${selectedRoomId}/beds`)
      .then(res => setCurrentBeds(res.data));
  };

  // 3. Handle Form Changes
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // 4. Submit Form (Add Bed)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // We need to merge the room_id into the data we send to the backend
    const payload = {
      ...formData,
      room_id: selectedRoomId
    };

    // Updated to match the backend's @app.route('/api/rooms/assign-bed')
    axios.post(`http://127.0.0.1:5000/api/rooms/assign-bed`, payload)
      .then(() => {
        alert("Bed Assigned Successfully!");
        fetchRoomBeds(); // Refresh the list
      })
      .catch(err => console.error("Error assigning bed:", err));
  };

  // 5. Delete Bed
  const handleDelete = (id) => {
    if(window.confirm("Remove this bed configuration?")) {
      // Updated to match the backend's @app.route('/api/room-beds/<int:id>')
      axios.delete(`http://127.0.0.1:5000/api/room-beds/${id}`)
        .then(() => fetchRoomBeds())
        .catch(err => console.error("Error deleting bed:", err));
    }
  };

  // Helper to get Room Number
  const currentRoom = rooms.find(r => r.id == selectedRoomId);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Module 3: Room Bed Assignment</h2>

      {/* ROOM SELECTOR */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #007bff' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Select Room:</label>
        <select 
          style={{ padding: '8px', fontSize: '15px', width: '250px' }}
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
        >
          {rooms.map(room => (
            <option key={room.id} value={room.id}>
              Room {room.room_number} - {room.room_type}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        
        {/* LEFT: FORM (Based on your screenshot) */}
        <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#007bff' }}>Add Bed Configuration</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <label style={{ fontWeight: 'bold' }}>Bed Type</label>
            <select name="bed_id" value={formData.bed_id} onChange={handleChange} style={inputStyle}>
              {bedTypes.map(bed => (
                <option key={bed.id} value={bed.id}>{bed.name}</option>
              ))}
            </select>

            <label style={{ fontWeight: 'bold' }}>Number of Beds</label>
            <input type="number" name="count" value={formData.count} onChange={handleChange} min="1" style={inputStyle} />

            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" name="allow_extra" checked={formData.allow_extra} onChange={handleChange} style={{ marginRight: '8px' }} />
                Allow Extra Bed (+Charge)
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" name="allow_rearrange" checked={formData.allow_rearrange} onChange={handleChange} style={{ marginRight: '8px' }} />
                Allow Rearranging
              </label>
            </div>

            <button type="submit" style={saveBtnStyle}>Save Bed Assignment</button>
          </form>
        </div>

        {/* RIGHT: CURRENT BEDS LIST (To see what we added) */}
        <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>
            Current Beds in {currentRoom ? `Room ${currentRoom.room_number}` : ''}
          </h3>
          
          {currentBeds.length === 0 ? <p style={{ color: '#888' }}>No beds assigned yet.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                  <th style={thStyle}>Bed Type</th>
                  <th style={thStyle}>Count</th>
                  <th style={thStyle}>Extra?</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentBeds.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{item.name}</td>
                    <td style={tdStyle}>{item.count}</td>
                    <td style={tdStyle}>
                      {item.allow_extra ? <span style={{color:'green'}}>Yes</span> : <span style={{color:'#ccc'}}>No</span>}
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => handleDelete(item.id)} style={deleteBtnStyle}>Remove</button>
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
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const saveBtnStyle = { marginTop: '10px', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' };
const thStyle = { padding: '10px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '10px' };
const deleteBtnStyle = { background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };