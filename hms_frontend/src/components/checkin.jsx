import React, { useState, useEffect } from 'react';

export default function CheckIn() {
    // --- MOCK DATABASE (Simulating Backend) ---
    // Status types: 'Confirmed' (Booked but not here), 'Checked In' (Active), 'Checked Out' (History)
    const [allBookings, setAllBookings] = useState([
        { 
            booking_id: 'BK-02162026-001', 
            guest_name: 'John Doe', 
            contact: '09171234567',
            room_number: '101', 
            room_type: 'Standard',
            check_in_date: '2026-02-16', 
            check_out_date: '2026-02-21',
            adults: 2, children: 1,
            deposit: 1000,
            status: 'Checked In' // Active
        },
        { 
            booking_id: 'BK-02182026-002', 
            guest_name: 'Sarah Connor', 
            contact: '09187654321',
            room_number: '205', 
            room_type: 'Deluxe',
            check_in_date: '2026-02-18', // Arriving Today
            check_out_date: '2026-02-23',
            adults: 1, children: 0,
            deposit: 0,
            status: 'Confirmed' // Not active yet
        },
        { 
            booking_id: 'BK-02182026-003', 
            guest_name: 'Tony Stark', 
            contact: '09998887777',
            room_number: '301', 
            room_type: 'Suite',
            check_in_date: '2026-02-18', 
            check_out_date: '2026-02-20',
            adults: 2, children: 0,
            deposit: 2000,
            status: 'Checked In' // Active
        }
    ]);

    // --- STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false); // To toggle between "Check In" and "Update Info" button

    // Form State (Always visible)
    const [formData, setFormData] = useState({
        booking_id: '',
        guest_name: '',
        contact: '',
        room_number: '',
        room_type: '',
        adults: 1,
        children: 0,
        deposit: 0,
        remarks: ''
    });

    // --- ACTIONS ---

    // 1. Search for a Booking
    const handleSearch = () => {
        const found = allBookings.find(b => b.booking_id.toLowerCase() === searchQuery.toLowerCase());
        
        if (!found) {
            alert("Booking ID not found!");
            return;
        }

        // Populate Form
        setFormData({
            booking_id: found.booking_id,
            guest_name: found.guest_name,
            contact: found.contact,
            room_number: found.room_number,
            room_type: found.room_type,
            adults: found.adults,
            children: found.children,
            deposit: found.deposit || 0,
            remarks: found.remarks || ''
        });

        // Determine Mode: If they are already checked in, we are Editing. If 'Confirmed', we are Checking In.
        if (found.status === 'Checked In') {
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
    };

    // 2. Submit Form (Check In OR Update)
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.booking_id) return alert("Please search for a booking first.");

        // Update the main database
        const updatedBookings = allBookings.map(b => {
            if (b.booking_id === formData.booking_id) {
                return {
                    ...b,
                    ...formData, // Overwrite with form data (e.g., changed room, added deposit)
                    status: 'Checked In', // Ensure status is active
                    check_in_actual: new Date().toLocaleString() // Timestamp the action
                };
            }
            return b;
        });

        setAllBookings(updatedBookings);
        alert(isEditing ? "Check-in Details Updated!" : "Guest Checked In Successfully!");
        
        // Reset
        setFormData({
            booking_id: '', guest_name: '', contact: '', room_number: '', 
            room_type: '', adults: 1, children: 0, deposit: 0, remarks: ''
        });
        setSearchQuery('');
        setIsEditing(false);
    };

    // 3. Edit from Table
    const handleEditFromTable = (booking) => {
        setSearchQuery(booking.booking_id); // Sync search bar
        setIsEditing(true);
        setFormData({
            booking_id: booking.booking_id,
            guest_name: booking.guest_name,
            contact: booking.contact,
            room_number: booking.room_number,
            room_type: booking.room_type,
            adults: booking.adults,
            children: booking.children,
            deposit: booking.deposit,
            remarks: booking.remarks || ''
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filter Active Guests for the Table
    const activeGuests = allBookings.filter(b => b.status === 'Checked In');

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
            <h2>Module 7: Check-In Management</h2>

            {/* --- SECTION 1: SEARCH & FORM --- */}
            <div style={cardStyle}>
                <h3 style={headerBlue}>Process Check-in / Edit Details</h3>
                
                {/* Search Bar */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                    <input 
                        type="text" 
                        placeholder="Enter Booking ID (e.g., BK-02182026-002)" 
                        style={{ ...inputStyle, flex: 1 }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleSearch} style={btnBlue}>Find Booking</button>
                </div>

                {/* The Form (Always Visible) */}
                <form onSubmit={handleSubmit} style={gridStyle}>
                    
                    {/* Row 1 */}
                    <div>
                        <label style={labelStyle}>Booking Reference (Read Only)</label>
                        <input 
                            style={{ ...inputStyle, background: '#f0f0f0', color: '#555' }} 
                            value={formData.booking_id} 
                            readOnly 
                            placeholder="Use Search to fill"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Guest Name</label>
                        <input 
                            style={inputStyle} 
                            value={formData.guest_name} 
                            onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                        />
                    </div>

                    {/* Row 2 */}
                    <div>
                        <label style={labelStyle}>Room Number</label>
                        <input 
                            style={inputStyle} 
                            value={formData.room_number} 
                            onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Room Type</label>
                        <input 
                            style={inputStyle} 
                            value={formData.room_type} 
                            onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                        />
                    </div>

                    {/* Row 3 */}
                    <div>
                        <label style={labelStyle}>Contact Number</label>
                        <input 
                            style={inputStyle} 
                            value={formData.contact} 
                            onChange={(e) => setFormData({...formData, contact: e.target.value})}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Key Deposit Fee (₱)</label>
                        <input 
                            type="number"
                            style={inputStyle} 
                            value={formData.deposit} 
                            onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                        />
                    </div>

                    {/* Row 4 */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Remarks / Special Requests</label>
                        <input 
                            style={inputStyle} 
                            placeholder="e.g. Extra pillow, Early check-in"
                            value={formData.remarks}
                            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                        />
                    </div>

                    {/* Action Button */}
                    <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                        <button type="submit" style={isEditing ? btnOrange : btnGreen}>
                            {isEditing ? 'Save Changes' : 'Confirm Check-in'}
                        </button>
                        {isEditing && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({ booking_id: '', guest_name: '', contact: '', room_number: '', room_type: '', adults: 1, children: 0, deposit: 0, remarks: '' });
                                    setSearchQuery('');
                                }}
                                style={{ ...btnSmall, marginLeft: '15px', color: '#666', textDecoration: 'none', border: '1px solid #ccc', padding: '10px 20px', borderRadius: '4px' }}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* --- SECTION 2: ACTIVE CHECK-INS TABLE --- */}
            <h3 style={{ marginTop: '40px', color: '#333' }}>Currently Active Guests (In-House)</h3>
            <div style={{ background: 'white', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#343a40', color: 'white' }}>
                        <tr>
                            <th style={thStyle}>Room</th>
                            <th style={thStyle}>Guest Name</th>
                            <th style={thStyle}>Booking ID</th>
                            <th style={thStyle}>Stay Dates</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeGuests.length > 0 ? activeGuests.map((guest, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#007bff' }}>{guest.room_number}</td>
                                <td style={tdStyle}>{guest.guest_name}</td>
                                <td style={{ ...tdStyle, fontSize: '13px', color: '#666' }}>{guest.booking_id}</td>
                                <td style={tdStyle}>
                                    {guest.check_in_date} to {guest.check_out_date}
                                </td>
                                <td style={tdStyle}>
                                    <span style={badgeGreen}>Active</span>
                                </td>
                                <td style={tdStyle}>
                                    <button 
                                        onClick={() => handleEditFromTable(guest)}
                                        style={btnLink}
                                    >
                                        Edit Details
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    No active guests found. Check in a confirmed booking to see them here.
                                </td>
                            </tr>
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
    maxWidth: '900px',
    marginBottom: '30px'
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
    padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
};

const btnGreen = {
    padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px'
};

const btnOrange = {
    padding: '12px 24px', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px'
};

const thStyle = { padding: '12px', textAlign: 'left', fontSize: '14px' };
const tdStyle = { padding: '12px', textAlign: 'left', fontSize: '14px', color: '#333' };

const badgeGreen = {
    background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
};

const btnLink = {
    background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px'
};

const btnSmall = { cursor: 'pointer', fontSize: '14px' };