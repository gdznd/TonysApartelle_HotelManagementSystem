import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  
  // Form State - Matches your MySQL columns
  const [formData, setFormData] = useState({
    id: null,
    room_number: '',
    room_type: 'Single Room',
    floor: '1',
    capacity: '1',
    price: '',
    status: 'Available'
  });

  const [isEditing, setIsEditing] = useState(false);

  // 1. Fetch Rooms
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = () => {
    axios.get('http://127.0.0.1:5000/api/rooms')
      .then(res => setRooms(res.data))
      .catch(err => console.error("Error fetching rooms:", err));
  };

  // 2. Handle Form Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Submit (Add or Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.room_number || !formData.price) {
        alert("Please fill in Room Number and Price");
        return;
    }

    if (isEditing) {
      // UPDATE Existing Room
      axios.put(`http://127.0.0.1:5000/api/rooms/${formData.id}`, formData)
        .then(() => { 
            alert("Room Updated Successfully!");
            fetchRooms(); 
            resetForm(); 
        })
        .catch(err => alert("Error updating room: " + err));
    } else {
      // ADD New Room
      axios.post('http://127.0.0.1:5000/api/rooms', formData)
        .then(() => { 
            alert("Room Added Successfully!");
            fetchRooms(); 
            resetForm(); 
        })
        .catch(err => alert("Error adding room. Check console."));
    }
  };

  // 4. Delete Room
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      axios.delete(`http://127.0.0.1:5000/api/rooms/${id}`)
        .then(() => fetchRooms())
        .catch(err => alert("Error deleting room"));
    }
  };

  // 5. Load Data into Form for Editing
  const handleEdit = (room) => {
    setFormData(room);
    setIsEditing(true);
  };

  // 6. Reset Form
  const resetForm = () => {
    setFormData({
      id: null,
      room_number: '',
      room_type: 'Single Room',
      floor: '1',
      capacity: '1',
      price: '',
      status: 'Available'
    });
    setIsEditing(false);
  };

  // Color Helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#28a745';
      case 'Occupied': return '#dc3545';
      case 'Cleanup': return '#ffc107';
      case 'Maintenance': return '#6c757d';
      case 'Reserved': return '#007bff';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <h2>Module 1: Room Management</h2>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: FORM */}
        <div style={{ flex: 1, padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9' }}>
          <h3 style={{ marginTop: 0 }}>{isEditing ? 'Edit Room' : 'Add New Room'}</h3>
          <form onSubmit={handleSubmit}>
            
            <label style={labelStyle}>Room Number:</label>
            <input type="text" name="room_number" value={formData.room_number} onChange={handleChange} style={inputStyle} placeholder="e.g. 101" />

            <label style={labelStyle}>Room Type:</label>
            <select name="room_type" value={formData.room_type} onChange={handleChange} style={inputStyle}>
                <option value="Single Room">Single Room</option>
                <option value="Double Room">Double Room</option>
                <option value="Suite">Suite</option>
                <option value="Deluxe">Deluxe</option>
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Floor:</label>
                    <input type="number" name="floor" value={formData.floor} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Capacity (Pax):</label>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} style={inputStyle} />
                </div>
            </div>

            <label style={labelStyle}>Price (Per Night):</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} style={inputStyle} placeholder="0.00" />

            <label style={labelStyle}>Current Status:</label>
            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Cleanup">Cleanup</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Reserved">Reserved</option>
            </select>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="submit" style={saveBtnStyle}>
                    {isEditing ? 'Update Room' : 'Save Room'}
                </button>
                {isEditing && (
                    <button type="button" onClick={resetForm} style={clearBtnStyle}>
                        Cancel
                    </button>
                )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: TABLE LIST */}
        <div style={{ flex: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#007bff', color: 'white', textAlign: 'left' }}>
                <th style={thStyle}>Room #</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Floor</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{...tdStyle, fontWeight: 'bold'}}>{room.room_number}</td>
                  <td style={tdStyle}>{room.room_type}</td>
                  <td style={tdStyle}>{room.floor}</td>
                  <td style={tdStyle}>₱{Number(room.price).toLocaleString()}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getStatusColor(room.status)
                    }}>
                      {room.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleEdit(room)} style={editBtnStyle}>Edit</button>
                    <button onClick={() => handleDelete(room.id)} style={deleteBtnStyle}>Delete</button>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No rooms found. Add one on the left.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Styles ---
const labelStyle = { display: 'block', marginTop: '10px', fontSize: '14px', fontWeight: 'bold', color: '#555' };
const inputStyle = { width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const thStyle = { padding: '12px' };
const tdStyle = { padding: '12px', background: 'white' };
const saveBtnStyle = { flex: 1, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const clearBtnStyle = { flex: 1, padding: '12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const editBtnStyle = { marginRight: '10px', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' };
const deleteBtnStyle = { color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' };