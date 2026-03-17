import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);

  // 1. Fetch rooms on load (Reads from Room Management)
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = () => {
    axios.get('http://127.0.0.1:5000/api/rooms')
      .then(response => {
        setRooms(response.data);
      })
      .catch(error => console.error("Error fetching rooms:", error));
  };

  // 2. Handle Status Change
  const handleStatusChange = (id, newStatus) => {
    axios.put(`http://127.0.0.1:5000/api/rooms/${id}/status`, { status: newStatus })
      .then(() => {
        // Update local state immediately for snappy UI
        setRooms(prevRooms => prevRooms.map(room => 
          room.id === id ? { ...room, status: newStatus } : room
        ));
      })
      .catch(error => alert("Failed to update status"));
  };

  // 3. Color Logic
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#28a745';    // Green
      case 'Occupied': return '#dc3545';     // Red
      case 'Cleanup': return '#ffc107';      // Yellow
      case 'Maintenance': return '#6c757d';  // Grey
      case 'Reserved': return '#007bff';     // Blue
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <h2 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        Module 0: Room Status Dashboard
      </h2>
      
      {/* THE ROOM GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: '20px', 
        marginTop: '20px' 
      }}>
        {rooms.map((room) => (
          <div 
            key={room.id} 
            style={{ 
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                padding: '20px',
                borderTop: `6px solid ${getStatusColor(room.status)}`,
                textAlign: 'center',
                transition: 'transform 0.2s'
            }}
          >
            <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#333' }}>
              {room.room_number}
            </h3>
            <p style={{ color: '#777', fontSize: '14px', margin: '0 0 15px 0', fontStyle: 'italic' }}>
              {room.room_type}
            </p>
            
            {/* STATUS DROPDOWN */}
            <select 
              value={room.status} 
              onChange={(e) => handleStatusChange(room.id, e.target.value)}
              style={{
                backgroundColor: getStatusColor(room.status),
                color: 'white',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                width: '100%',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Cleanup">Cleanup</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Reserved">Reserved</option>
            </select>
          </div>
        ))}

        {rooms.length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: '40px' }}>
            No rooms found. Please go to <strong>Room Management</strong> to add rooms.
          </p>
        )}
      </div>
    </div>
  );
}