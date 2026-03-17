import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Booking() {
  const [rooms, setRooms] = useState([]); // Available rooms
  const [bookings, setBookings] = useState([]); // Booking History
  
  // Form State
  const [formData, setFormData] = useState({
    booking_reference: '', // NEW: Stores the generated ID
    first_name: '', last_name: '', contact_number: '', email: '',
    address: '', gender: 'Prefer not to say',
    room_id: '', 
    check_in: '', check_out: '',
    adults: 1, children: 0,
    booking_type: 'Walk-in',
    status: 'Confirmed',
    special_requests: ''
  });

  // Derived State for Price Calculation
  const [totalPrice, setTotalPrice] = useState(0);

  // 1. Initial Load
  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, []);

  // 2. Data Fetchers
  const fetchRooms = () => {
    axios.get('http://127.0.0.1:5000/api/rooms').then(res => {
      setRooms(res.data);
      if(res.data.length > 0 && !formData.room_id) {
        setFormData(prev => ({...prev, room_id: res.data[0].id}));
      }
    });
  };

  const fetchBookings = () => {
    axios.get('http://127.0.0.1:5000/api/bookings').then(res => setBookings(res.data));
  };

  // --- NEW: ID GENERATOR FUNCTION ---
  const generateBookingID = (e) => {
    e.preventDefault(); // Stop form submission
    
    const now = new Date();
    const year = now.getFullYear();
    
    // Format Date: MMDDYYYY
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateString = `${mm}${dd}${year}`;

    // Calculate Sequence Number
    // Filter existing bookings to find how many are from THIS year
    // Note: In a real app, the backend usually does this count to be safe.
    // For now, we count the rows in the table + 1.
    const bookingsThisYear = bookings.filter(b => {
        // Assuming your backend saves a 'created_at' or we just parse the current ID if it exists
        // simplified: just counting total bookings for this demo + 1
        return true; 
    }).length;

    const nextSequence = bookingsThisYear + 1;
    const sequenceString = String(nextSequence).padStart(4, '0'); // e.g. "0043"

    // Combine: BK-02182026-0043
    const newID = `BK-${dateString}-${sequenceString}`;
    
    setFormData(prev => ({ ...prev, booking_reference: newID }));
  };

  // 3. Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 4. Auto-Calculate Price
  useEffect(() => {
    if (formData.room_id && formData.check_in && formData.check_out) {
      const room = rooms.find(r => r.id == formData.room_id); // Loose equality for string/int
      if (room) {
        const start = new Date(formData.check_in);
        const end = new Date(formData.check_out);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays > 0) {
          setTotalPrice(diffDays * room.price);
        } else {
          setTotalPrice(0);
        }
      }
    }
  }, [formData.room_id, formData.check_in, formData.check_out, rooms]);

  // 5. Submit Booking
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.booking_reference) {
        alert("Please generate a Booking ID first!");
        return;
    }

    const payload = { ...formData, total_price: totalPrice };
    
    axios.post('http://127.0.0.1:5000/api/bookings', payload)
      .then(() => {
        alert("Booking Confirmed!");
        fetchBookings();
        fetchRooms();
        // Reset ID for next booking
        setFormData(prev => ({ ...prev, booking_reference: '' })); 
      })
      .catch(err => console.error(err));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      axios.delete(`http://127.0.0.1:5000/api/bookings/${id}`)
        .then(() => {
          alert("Booking Deleted!");
          fetchBookings();
        })
        .catch(err => {
          console.error(err);
          alert("Error deleting booking.");
        });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Module 5: New Booking</h2>

      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
        
        {/* --- SECTION A: BOOKING FORM --- */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#007bff', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>Guest & Trip Details</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={gridStyle}>
              {/* Row 1 */}
              <div><label>First Name</label><input required name="first_name" value={formData.first_name} onChange={handleChange} style={inputStyle} /></div>
              <div><label>Last Name</label><input required name="last_name" value={formData.last_name} onChange={handleChange} style={inputStyle} /></div>
              
              {/* Row 2 */}
              <div><label>Contact No.</label><input required name="contact_number" value={formData.contact_number} onChange={handleChange} style={inputStyle} /></div>
              <div><label>Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} style={inputStyle} /></div>

              {/* Row 3 */}
              <div><label>Check-in</label><input required type="date" name="check_in" value={formData.check_in} onChange={handleChange} style={inputStyle} /></div>
              <div><label>Check-out</label><input required type="date" name="check_out" value={formData.check_out} onChange={handleChange} style={inputStyle} /></div>
              
              {/* Row 4: Room Selection */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{fontWeight:'bold', color: '#28a745'}}>Select Room</label>
                <select name="room_id" value={formData.room_id} onChange={handleChange} style={{...inputStyle, border: '2px solid #28a745'}}>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} ({r.room_type}) - PHP {r.price}/night
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 5: Adults & Children */}
              <div><label>Adults</label><input type="number" name="adults" value={formData.adults} onChange={handleChange} style={inputStyle} /></div>
              <div><label>Children</label><input type="number" name="children" value={formData.children} onChange={handleChange} style={inputStyle} /></div>

              {/* --- NEW ROW: GENERATE ID --- */}
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-end', gap: '10px', marginTop: '10px' }}>
                 <div style={{flex: 1}}>
                    <label style={{fontWeight:'bold', color:'#007bff'}}>Booking ID (Required)</label>
                    <input 
                        type="text" 
                        readOnly 
                        value={formData.booking_reference} 
                        placeholder="Click button to generate..."
                        style={{...inputStyle, backgroundColor: '#f8f9fa', fontWeight:'bold', letterSpacing:'1px'}} 
                    />
                 </div>
                 <button 
                    onClick={generateBookingID}
                    style={{
                        padding: '12px 20px',
                        backgroundColor: '#005be4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        height: '46px' // Match input height roughly
                    }}
                 >
                    Generate ID
                 </button>
              </div>

            </div>

            {/* Total Price Display */}
            <div style={{ marginTop: '20px', padding: '15px', background: '#e9ecef', borderRadius: '5px', textAlign: 'right' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Estimated Price: </span>
              <span style={{ fontSize: '24px', color: '#28a745', fontWeight: 'bold' }}>
                  PHP {totalPrice.toLocaleString()}
              </span>
            </div>

            <button type="submit" style={confirmBtnStyle}>Confirm Booking</button>
          </form>
        </div>

        {/* --- SECTION B: BOOKINGS TABLE --- */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Recent Bookings</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#343a40', color: 'white', textAlign: 'left' }}>
                {/* 1. New Column Header */}
                <th style={thStyle}>Booking ID</th>
                <th style={thStyle}>Guest</th>
                <th style={thStyle}>Room</th>
                <th style={thStyle}>Dates</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                  {/* 1. New Column Data */}
                  <td style={{...tdStyle, fontWeight:'bold', color:'#007bff'}}>
                    {b.booking_reference || "N/A"}
                  </td>
                  
                  <td style={tdStyle}>
                    <strong>{b.first_name} {b.last_name}</strong><br/>
                    <span style={{fontSize:'12px', color:'#666'}}>{b.contact_number}</span>
                  </td>
                  <td style={tdStyle}>{b.room_number} <br/><small>({b.room_type})</small></td>
                  <td style={tdStyle}>{b.check_in} to {b.check_out}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding:'4px 8px', borderRadius:'4px', color:'white', fontSize:'12px',
                      background: b.status === 'Confirmed' ? '#28a745' : '#ffc107'
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={tdStyle}>${b.total_price}</td>
                  
                  <td style={tdStyle}>
                    <button 
                        onClick={() => handleDelete(b.id)}
                        style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Delete
                    </button>
                  </td>

                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan="7" style={{padding:'20px', textAlign:'center'}}>No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

// --- Styles ---
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px', boxSizing:'border-box' };
const confirmBtnStyle = { marginTop: '20px', width: '100%', padding: '15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' };
const thStyle = { padding: '12px' };
const tdStyle = { padding: '12px', verticalAlign: 'top' };