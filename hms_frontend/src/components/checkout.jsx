import React, { useState, useEffect } from 'react';

export default function CheckOut() {
    // --- STATE ---
    const [guests, setGuests] = useState([]); // Data from DB
    const [activeTab, setActiveTab] = useState('On Time'); // 'On Time' | 'Late'
    const [selectedGuest, setSelectedGuest] = useState(null); // Guest being processed
    const [loading, setLoading] = useState(true);

    // Get real current date (YYYY-MM-DD)
    const getTodayDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const TODAY = getTodayDate();

    // --- 1. FETCH FROM BACKEND ---
    const fetchDueCheckouts = async () => {
        try {
            // We fetch ALL active check-ins, then filter them here
            const response = await fetch('http://127.0.0.1:5000/api/checkouts/due');
            const data = await response.json();
            setGuests(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching checkouts:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDueCheckouts();
    }, []);

    // --- 2. FILTER LOGIC (Real-time) ---
    const filteredGuests = guests.filter(g => {
        if (activeTab === 'On Time') {
            // Show guests checking out TODAY
            return g.check_out_date === TODAY;
        } else {
            // Show guests whose checkout date is BEFORE today (Overdue)
            return g.check_out_date < TODAY;
        }
    });

    // --- FORM STATE ---
    const [formData, setFormData] = useState({
        key_returned: false,
        amenities_ok: true,
        room_condition: 'Good', 
        damage_charge: 0,
        damage_notes: '',
        final_payment: 0
    });

    // --- ACTIONS ---
    const handleProcessClick = (guest) => {
        const balance = guest.total_price - guest.amount_paid;
        
        setSelectedGuest(guest);
        setFormData({
            key_returned: false,
            amenities_ok: true,
            room_condition: 'Good',
            damage_charge: 0,
            damage_notes: '',
            final_payment: balance > 0 ? balance : 0 // Suggest remaining balance
        });
    };

    const handleConfirmCheckout = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('http://127.0.0.1:5000/api/checkouts/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: selectedGuest.id, // Database ID
                    ...formData
                })
            });

            if (response.ok) {
                alert(`✅ Checkout Complete for ${selectedGuest.guest_name}!`);
                setSelectedGuest(null);
                fetchDueCheckouts(); // Refresh list
            } else {
                alert("Error processing checkout.");
            }
        } catch (error) {
            console.error(error);
            alert("Connection error.");
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
            <h2>Module 9: Guest Checkout</h2>
            
            {/* --- SECTION 1: CHECKOUT MODAL FORM --- */}
            {selectedGuest && (
                <div style={modalOverlayStyle}>
                    <div style={modalCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#dc3545' }}>Processing Checkout: Room {selectedGuest.room_number}</h3>
                            <button onClick={() => setSelectedGuest(null)} style={closeBtnStyle}>✖</button>
                        </div>

                        <form onSubmit={handleConfirmCheckout} style={gridStyle}>
                            {/* Read-Only Info */}
                            <div style={groupStyle}>
                                <label style={labelStyle}>Guest Name</label>
                                <input style={readOnlyInput} value={selectedGuest.guest_name} readOnly />
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Balance Due (Before Charges)</label>
                                <input 
                                    style={readOnlyInput} 
                                    value={`₱${(selectedGuest.total_price - selectedGuest.amount_paid).toLocaleString()}`} 
                                    readOnly 
                                />
                            </div>

                            {/* Inspections */}
                            <div style={groupStyle}>
                                <label style={labelStyle}>Key Returned?</label>
                                <select 
                                    style={inputStyle}
                                    value={formData.key_returned}
                                    onChange={e => setFormData({...formData, key_returned: e.target.value === 'true'})}
                                >
                                    <option value={false}>No</option>
                                    <option value={true}>Yes</option>
                                </select>
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Room Condition</label>
                                <select 
                                    style={inputStyle}
                                    value={formData.room_condition}
                                    onChange={e => setFormData({...formData, room_condition: e.target.value})}
                                >
                                    <option>Good</option>
                                    <option>Needs Cleaning</option>
                                    <option>Maintenance Required</option>
                                </select>
                            </div>

                            {/* Charges */}
                            <div style={groupStyle}>
                                <label style={labelStyle}>Damage/Lost Item Charge (₱)</label>
                                <input 
                                    type="number" 
                                    style={inputStyle} 
                                    value={formData.damage_charge}
                                    onChange={e => setFormData({...formData, damage_charge: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Damage Notes</label>
                                <input 
                                    type="text" 
                                    placeholder="Describe damage..."
                                    style={inputStyle} 
                                    value={formData.damage_notes}
                                    onChange={e => setFormData({...formData, damage_notes: e.target.value})}
                                />
                            </div>

                            {/* Final Payment */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{...labelStyle, color: '#dc3545', fontSize: '14px'}}>
                                    Final Payment to Collect (₱)
                                </label>
                                <input 
                                    type="number" 
                                    style={{...inputStyle, fontWeight:'bold', borderColor:'#dc3545', padding:'12px'}} 
                                    value={formData.final_payment}
                                    onChange={e => setFormData({...formData, final_payment: parseFloat(e.target.value) || 0})}
                                />
                                <small style={{color:'#666'}}>
                                    (Suggested: ₱{(selectedGuest.total_price - selectedGuest.amount_paid + formData.damage_charge).toLocaleString()})
                                </small>
                            </div>

                            <button type="submit" style={btnRed}>Confirm Checkout & Clear Room</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- SECTION 2: TABS --- */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '0' }}>
                <button 
                    style={activeTab === 'On Time' ? tabActive : tabInactive} 
                    onClick={() => setActiveTab('On Time')}
                >
                    Scheduled Today
                </button>
                <button 
                    style={activeTab === 'Late' ? tabActiveRed : tabInactive} 
                    onClick={() => setActiveTab('Late')}
                >
                    Overdue / Late
                </button>
            </div>

            {/* --- SECTION 3: LIST TABLE --- */}
            <div style={{ background: 'white', borderTop: `5px solid ${activeTab === 'Late' ? '#dc3545' : '#28a745'}`, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        <tr>
                            <th style={thStyle}>Room</th>
                            <th style={thStyle}>Guest Name</th>
                            <th style={thStyle}>Booking ID</th>
                            <th style={thStyle}>Checkout Date</th>
                            <th style={thStyle}>Balance</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center' }}>Loading guests...</td></tr>
                        ) : filteredGuests.length > 0 ? (
                            filteredGuests.map(g => (
                                <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#007bff' }}>{g.room_number}</td>
                                    <td style={tdStyle}>{g.guest_name}</td>
                                    <td style={{...tdStyle, fontSize:'12px', color:'#666'}}>{g.booking_reference}</td>
                                    <td style={{ ...tdStyle, fontWeight: activeTab === 'Late' ? 'bold' : 'normal' }}>
                                        {g.check_out_date}
                                    </td>
                                    <td style={{...tdStyle, color: (g.total_price - g.amount_paid) > 0 ? '#dc3545' : '#28a745', fontWeight:'bold'}}>
                                        ₱{(g.total_price - g.amount_paid).toLocaleString()}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={activeTab === 'Late' ? badgeRed : badgeGreen}>
                                            {activeTab === 'Late' ? 'Overdue' : 'Due Today'}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button onClick={() => handleProcessClick(g)} style={btnOutline}>
                                            Process Checkout
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                    No checkouts found for this category.
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
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};

const modalCardStyle = {
    background: '#fff', padding: '30px', borderRadius: '8px', width: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', animation: 'popIn 0.3s'
};

const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const groupStyle = { display: 'flex', flexDirection: 'column' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' };

const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' };
const readOnlyInput = { ...inputStyle, background: '#f9f9f9', border: '1px solid #eee', color: '#555' };

const closeBtnStyle = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' };

const btnRed = { gridColumn: 'span 2', padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop:'10px' };
const btnOutline = { padding: '6px 12px', background: 'white', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' };

const tabBase = { padding: '12px 25px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' };
const tabActive = { ...tabBase, background: '#28a745', color: 'white' };
const tabActiveRed = { ...tabBase, background: '#dc3545', color: 'white' };
const tabInactive = { ...tabBase, background: '#e0e0e0', color: '#666' };

const thStyle = { padding: '15px', textAlign: 'left', fontSize: '13px', color: '#444', fontWeight: 'bold' };
const tdStyle = { padding: '15px', textAlign: 'left', fontSize: '14px', color: '#333' };
const badgeGreen = { background: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' };
const badgeRed = { background: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' };