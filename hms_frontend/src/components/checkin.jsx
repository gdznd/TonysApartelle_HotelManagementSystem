import React, { useState, useEffect } from 'react';

const BASE_URL = 'http://127.0.0.1:5000';

export default function CheckIn() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeCheckins, setActiveCheckins] = useState([]);

    const [formData, setFormData] = useState({
        booking_id: '',         // integer PK
        booking_reference: '',  // display only
        guest_name: '',
        contact: '',
        room_number: '',
        room_type: '',
        adults: 1,
        children: 0,
        id_type: 'Driver\'s License',
        id_number: '',
        key_deposit: 0,
        key_issued: false,
        notes: '',
        checkin_time: new Date().toISOString().slice(0, 16), // datetime-local format
    });

    // --- FETCH ACTIVE CHECK-INS ON LOAD ---
    const fetchActiveCheckins = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/checkins/active`);
            const data = await res.json();
            setActiveCheckins(data);
        } catch (err) {
            console.error("Error fetching active check-ins:", err);
        }
    };

    useEffect(() => {
        fetchActiveCheckins();
    }, []);

    // --- SEARCH: Find confirmed booking from DB ---
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            alert("Please enter a Booking Reference or Guest Name.");
            return;
        }
        setIsSearching(true);
        setIsEditing(false);
        try {
            const res = await fetch(`${BASE_URL}/api/bookings/search?q=${encodeURIComponent(searchQuery.trim())}`);
            const results = await res.json();

            if (!results || results.length === 0) {
                alert("No confirmed booking found. Make sure the booking exists and has 'Confirmed' status.");
                return;
            }

            // Use first result
            const b = results[0];
            setFormData({
                booking_id: b.id,
                booking_reference: b.booking_reference || `#${b.id}`,
                guest_name: `${b.first_name} ${b.last_name}`,
                contact: b.contact_number,
                room_number: b.room_number,
                room_type: b.room_type,
                adults: b.adults,
                children: b.children,
                id_type: "Driver's License",
                id_number: '',
                key_deposit: 0,
                key_issued: false,
                notes: b.special_requests || '',
                checkin_time: new Date().toISOString().slice(0, 16),
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Search error:", err);
            alert("Could not connect to server.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    // --- SUBMIT CHECK-IN ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.booking_id) return alert("Please search for a booking first.");
        if (!formData.id_number.trim()) return alert("Please enter the guest's ID number.");

        setIsSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}/api/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: formData.booking_id,
                    id_type: formData.id_type,
                    id_number: formData.id_number,
                    key_deposit: formData.key_deposit,
                    key_issued: formData.key_issued,
                    notes: formData.notes,
                    checkin_time: formData.checkin_time,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error: ${err.error || 'Failed to check in.'}`);
                return;
            }

            alert(`✅ Guest Checked In Successfully!\n${formData.guest_name} — Room ${formData.room_number}`);
            resetForm();
            fetchActiveCheckins();

        } catch (err) {
            console.error("Check-in error:", err);
            alert("Could not connect to server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- LOAD FROM TABLE ---
    const handleEditFromTable = (checkin) => {
        setSearchQuery(checkin.booking_id);
        setIsEditing(true);
        setFormData({
            booking_id: checkin.booking_id,
            booking_reference: checkin.booking_id,
            guest_name: `${checkin.first_name} ${checkin.last_name}`,
            contact: checkin.contact_number || '',
            room_number: checkin.room_number,
            room_type: '',
            adults: 0,
            children: 0,
            id_type: checkin.id_type || "Driver's License",
            id_number: checkin.id_number || '',
            key_deposit: checkin.key_deposit || 0,
            key_issued: checkin.key_issued || false,
            notes: checkin.notes || '',
            checkin_time: checkin.checkin_time?.slice(0, 16) || new Date().toISOString().slice(0, 16),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            booking_id: '', booking_reference: '', guest_name: '', contact: '',
            room_number: '', room_type: '', adults: 1, children: 0,
            id_type: "Driver's License", id_number: '', key_deposit: 0,
            key_issued: false, notes: '',
            checkin_time: new Date().toISOString().slice(0, 16),
        });
        setSearchQuery('');
        setIsEditing(false);
    };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
            <h2>Module 8: Check-In Management</h2>

            {/* SEARCH & FORM */}
            <div style={cardStyle}>
                <h3 style={headerBlue}>Process Check-in</h3>

                {/* Search */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search by Booking Reference or Guest Name..."
                        style={{ ...inputStyle, flex: 1 }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <button onClick={handleSearch} style={btnBlue} disabled={isSearching}>
                        {isSearching ? 'Searching...' : 'Find Booking'}
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={gridStyle}>

                    {/* Row 1: Booking Ref + Guest Name */}
                    <div>
                        <label style={labelStyle}>Booking Reference (Read Only)</label>
                        <input
                            style={{ ...inputStyle, background: '#f0f0f0', color: '#555' }}
                            value={formData.booking_reference}
                            readOnly
                            placeholder="Use search to fill"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Guest Name</label>
                        <input style={{ ...inputStyle, background: '#f0f0f0', color: '#555' }} value={formData.guest_name} readOnly />
                    </div>

                    {/* Row 2: Room + Contact */}
                    <div>
                        <label style={labelStyle}>Room</label>
                        <input style={{ ...inputStyle, background: '#f0f0f0', color: '#555' }} value={`${formData.room_number} ${formData.room_type ? `(${formData.room_type})` : ''}`} readOnly />
                    </div>
                    <div>
                        <label style={labelStyle}>Contact Number</label>
                        <input style={{ ...inputStyle, background: '#f0f0f0', color: '#555' }} value={formData.contact} readOnly />
                    </div>

                    {/* Row 3: ID Type + ID Number */}
                    <div>
                        <label style={labelStyle}>ID Type</label>
                        <select
                            style={inputStyle}
                            value={formData.id_type}
                            onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                        >
                            <option>Driver's License</option>
                            <option>Passport</option>
                            <option>PhilSys ID</option>
                            <option>Voter's ID</option>
                            <option>School ID</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>ID Number <span style={{ color: '#dc3545' }}>*</span></label>
                        <input
                            style={inputStyle}
                            placeholder="e.g. N01-23-456789"
                            value={formData.id_number}
                            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                            required
                        />
                    </div>

                    {/* Row 4: Key Deposit + Key Issued */}
                    <div>
                        <label style={labelStyle}>Key Deposit Fee (₱)</label>
                        <input
                            type="number"
                            style={inputStyle}
                            value={formData.key_deposit}
                            onChange={(e) => setFormData({ ...formData, key_deposit: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                            <input
                                type="checkbox"
                                checked={formData.key_issued}
                                onChange={(e) => setFormData({ ...formData, key_issued: e.target.checked })}
                                style={{ width: '16px', height: '16px' }}
                            />
                            Key Issued to Guest
                        </label>
                    </div>

                    {/* Row 5: Check-in Time */}
                    <div>
                        <label style={labelStyle}>Check-in Date & Time</label>
                        <input
                            type="datetime-local"
                            style={inputStyle}
                            value={formData.checkin_time}
                            onChange={(e) => setFormData({ ...formData, checkin_time: e.target.value })}
                        />
                    </div>

                    {/* Row 6: Notes */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Notes / Special Requests</label>
                        <input
                            style={inputStyle}
                            placeholder="e.g. Extra pillow, early check-in..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* Buttons */}
                    <div style={{ gridColumn: 'span 2', marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            style={{ ...btnGreen, opacity: isSubmitting ? 0.6 : 1 }}
                            disabled={isSubmitting || !formData.booking_id}
                        >
                            {isSubmitting ? 'Processing...' : '✅ Confirm Check-in'}
                        </button>
                        {formData.booking_id && (
                            <button type="button" onClick={resetForm} style={btnGrey}>
                                Clear Form
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* ACTIVE CHECK-INS TABLE */}
            <h3 style={{ marginTop: '40px', color: '#333' }}>Currently Active Guests (In-House)</h3>
            <div style={{ background: 'white', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#343a40', color: 'white' }}>
                        <tr>
                            <th style={thStyle}>Room</th>
                            <th style={thStyle}>Guest Name</th>
                            <th style={thStyle}>Booking ID</th>
                            <th style={thStyle}>Check-in Time</th>
                            <th style={thStyle}>Key Issued</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeCheckins.length > 0 ? activeCheckins.map((c, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#007bff' }}>{c.room_number}</td>
                                <td style={tdStyle}>{c.first_name} {c.last_name}</td>
                                <td style={{ ...tdStyle, fontSize: '13px', color: '#666' }}>{c.booking_id}</td>
                                <td style={tdStyle}>{c.checkin_time ? new Date(c.checkin_time).toLocaleString() : '—'}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                        background: c.key_issued ? '#d4edda' : '#fff3cd',
                                        color: c.key_issued ? '#155724' : '#856404'
                                    }}>
                                        {c.key_issued ? 'Issued' : 'Not Issued'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <button onClick={() => handleEditFromTable(c)} style={btnLink}>
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                                    No active guests. Check in a confirmed booking above.
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
const cardStyle = { background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '900px', marginBottom: '30px' };
const headerBlue = { color: '#007bff', marginTop: 0, marginBottom: '20px' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '20px', rowGap: '15px' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' };
const btnBlue = { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const btnGreen = { padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' };
const btnGrey = { padding: '12px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const thStyle = { padding: '12px', textAlign: 'left', fontSize: '14px' };
const tdStyle = { padding: '12px', textAlign: 'left', fontSize: '14px', color: '#333' };
const btnLink = { background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' };
