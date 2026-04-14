import React, { useState, useEffect } from 'react';

const BASE_URL = 'http://127.0.0.1:5000';

export default function CheckOut() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [checkedInGuests, setCheckedInGuests] = useState([]);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('On Time');

    const getTodayDate = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const TODAY = getTodayDate();

    const [formData, setFormData] = useState({
        key_returned: false,
        amenities_ok: true,
        room_condition_ok: true,
        final_room_condition: 'Good',
        damage_charge: 0,
        damage_notes: '',
        guest_feedback: '',
        final_balance_paid: 0,
        checkout_time: new Date().toISOString().slice(0, 16),
    });

    // --- FETCH ALL CHECKED-IN GUESTS ---
    const fetchCheckedInGuests = async () => {
        setLoading(true);
        try {
            // Use the existing active checkins endpoint and also get booking info
            const res = await fetch(`${BASE_URL}/api/checkout/search?q=`);
            const data = await res.json();
            setCheckedInGuests(data);
        } catch (err) {
            console.error("Error fetching guests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheckedInGuests();
    }, []);

    // --- FILTER by tab ---
    const filteredGuests = checkedInGuests.filter(g => {
        const checkOut = g.check_out?.split('T')[0] || g.check_out;
        if (activeTab === 'On Time') return checkOut === TODAY;
        return checkOut < TODAY; // Overdue
    });

    // --- SEARCH ---
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchCheckedInGuests();
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`${BASE_URL}/api/checkout/search?q=${encodeURIComponent(searchQuery.trim())}`);
            const data = await res.json();
            setCheckedInGuests(data);
        } catch (err) {
            console.error("Search error:", err);
            alert("Could not connect to server.");
        } finally {
            setIsSearching(false);
        }
    };

    // --- OPEN CHECKOUT FORM ---
    const handleProcessClick = (guest) => {
        const balance = parseFloat(guest.total_price || 0) - parseFloat(guest.amount_paid || 0);
        setSelectedGuest(guest);
        setFormData({
            key_returned: false,
            amenities_ok: true,
            room_condition_ok: true,
            final_room_condition: 'Good',
            damage_charge: 0,
            damage_notes: '',
            guest_feedback: '',
            final_balance_paid: balance > 0 ? balance : 0,
            checkout_time: new Date().toISOString().slice(0, 16),
        });
    };

    // --- SUBMIT CHECKOUT ---
    const handleConfirmCheckout = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${BASE_URL}/api/checkout/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: selectedGuest.id,
                    checkout_time: formData.checkout_time,
                    amenities_ok: formData.amenities_ok,
                    room_condition_ok: formData.room_condition_ok,
                    key_returned: formData.key_returned,
                    damage_notes: formData.damage_notes,
                    damage_charge: formData.damage_charge,
                    final_room_condition: formData.final_room_condition,
                    guest_feedback: formData.guest_feedback,
                    total_bill: selectedGuest.total_price,
                    final_balance_paid: formData.final_balance_paid,
                }),
            });

            if (res.ok) {
                alert(`✅ Checkout Complete!\n${selectedGuest.first_name} ${selectedGuest.last_name} — Room ${selectedGuest.room_number}`);
                setSelectedGuest(null);
                setSearchQuery('');
                fetchCheckedInGuests();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'Checkout failed.'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Connection error.");
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
            <h2>Module 9: Guest Check-Out</h2>

            {/* CHECKOUT MODAL */}
            {selectedGuest && (
                <div style={modalOverlayStyle}>
                    <div style={modalCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#dc3545' }}>
                                Checkout — {selectedGuest.first_name} {selectedGuest.last_name} (Room {selectedGuest.room_number})
                            </h3>
                            <button onClick={() => setSelectedGuest(null)} style={closeBtnStyle}>✖</button>
                        </div>

                        <form onSubmit={handleConfirmCheckout} style={gridStyle}>

                            {/* Read-only info */}
                            <div style={groupStyle}>
                                <label style={labelStyle}>Booking Reference</label>
                                <input style={readOnlyInput} value={selectedGuest.booking_reference || `#${selectedGuest.id}`} readOnly />
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Balance Due</label>
                                <input
                                    style={{ ...readOnlyInput, color: (parseFloat(selectedGuest.total_price) - parseFloat(selectedGuest.amount_paid || 0)) > 0 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}
                                    value={`₱${(parseFloat(selectedGuest.total_price || 0) - parseFloat(selectedGuest.amount_paid || 0)).toLocaleString()}`}
                                    readOnly
                                />
                            </div>

                            {/* Inspections */}
                            <div style={groupStyle}>
                                <label style={labelStyle}>Key Returned?</label>
                                <select style={inputStyle} value={formData.key_returned} onChange={e => setFormData({ ...formData, key_returned: e.target.value === 'true' })}>
                                    <option value={false}>No</option>
                                    <option value={true}>Yes</option>
                                </select>
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Room Condition</label>
                                <select style={inputStyle} value={formData.final_room_condition} onChange={e => setFormData({ ...formData, final_room_condition: e.target.value })}>
                                    <option>Good</option>
                                    <option>Needs Cleaning</option>
                                    <option>Maintenance Required</option>
                                </select>
                            </div>

                            {/* Damage */}
                            <div style={groupStyle}>
                                <label style={labelStyle}>Damage/Lost Item Charge (₱)</label>
                                <input type="number" style={inputStyle} value={formData.damage_charge}
                                    onChange={e => setFormData({ ...formData, damage_charge: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Damage Notes</label>
                                <input type="text" placeholder="Describe damage..." style={inputStyle} value={formData.damage_notes}
                                    onChange={e => setFormData({ ...formData, damage_notes: e.target.value })} />
                            </div>

                            {/* Guest feedback */}
                            <div style={{ ...groupStyle, gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Guest Feedback / Notes</label>
                                <input type="text" placeholder="e.g. Guest enjoyed the stay..." style={inputStyle} value={formData.guest_feedback}
                                    onChange={e => setFormData({ ...formData, guest_feedback: e.target.value })} />
                            </div>

                            {/* Checkout time */}
                            <div style={groupStyle}>
                                <label style={labelStyle}>Check-out Date & Time</label>
                                <input type="datetime-local" style={inputStyle} value={formData.checkout_time}
                                    onChange={e => setFormData({ ...formData, checkout_time: e.target.value })} />
                            </div>

                            {/* Final payment */}
                            <div style={groupStyle}>
                                <label style={{ ...labelStyle, color: '#dc3545' }}>Final Payment to Collect (₱)</label>
                                <input type="number" style={{ ...inputStyle, borderColor: '#dc3545', fontWeight: 'bold' }}
                                    value={formData.final_balance_paid}
                                    onChange={e => setFormData({ ...formData, final_balance_paid: parseFloat(e.target.value) || 0 })} />
                                <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                                    Suggested: ₱{(parseFloat(selectedGuest.total_price || 0) - parseFloat(selectedGuest.amount_paid || 0) + formData.damage_charge).toLocaleString()}
                                </small>
                            </div>

                            <button type="submit" style={btnRed}>
                                ✅ Confirm Checkout & Clear Room
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* SEARCH BAR */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '600px' }}>
                <input
                    type="text"
                    placeholder="Search by guest name or room number..."
                    style={{ ...inputStyle, flex: 1 }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} style={btnBlue} disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
                {searchQuery && (
                    <button onClick={() => { setSearchQuery(''); fetchCheckedInGuests(); }} style={btnGrey}>
                        Clear
                    </button>
                )}
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '0' }}>
                <button style={activeTab === 'On Time' ? tabActive : tabInactive} onClick={() => setActiveTab('On Time')}>
                    Scheduled Today ({checkedInGuests.filter(g => (g.check_out?.split('T')[0] || g.check_out) === TODAY).length})
                </button>
                <button style={activeTab === 'Late' ? tabActiveRed : tabInactive} onClick={() => setActiveTab('Late')}>
                    Overdue / Late ({checkedInGuests.filter(g => (g.check_out?.split('T')[0] || g.check_out) < TODAY).length})
                </button>
                <button style={activeTab === 'All' ? tabActiveBlue : tabInactive} onClick={() => setActiveTab('All')}>
                    All Checked-In ({checkedInGuests.length})
                </button>
            </div>

            {/* TABLE */}
            <div style={{ background: 'white', borderTop: `5px solid ${activeTab === 'Late' ? '#dc3545' : activeTab === 'All' ? '#007bff' : '#28a745'}`, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        <tr>
                            <th style={thStyle}>Room</th>
                            <th style={thStyle}>Guest Name</th>
                            <th style={thStyle}>Booking Ref</th>
                            <th style={thStyle}>Check-out Date</th>
                            <th style={thStyle}>Balance</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center' }}>Loading guests...</td></tr>
                        ) : (activeTab === 'All' ? checkedInGuests : filteredGuests).length > 0 ? (
                            (activeTab === 'All' ? checkedInGuests : filteredGuests).map(g => {
                                const balance = parseFloat(g.total_price || 0) - parseFloat(g.amount_paid || 0);
                                const checkOutDate = g.check_out?.split('T')[0] || g.check_out;
                                const isLate = checkOutDate < TODAY;
                                return (
                                    <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#007bff' }}>{g.room_number}</td>
                                        <td style={tdStyle}>{g.first_name} {g.last_name}</td>
                                        <td style={{ ...tdStyle, fontSize: '12px', color: '#666' }}>{g.booking_reference || `#${g.id}`}</td>
                                        <td style={{ ...tdStyle, fontWeight: isLate ? 'bold' : 'normal', color: isLate ? '#dc3545' : '#333' }}>
                                            {checkOutDate}
                                            {isLate && <span style={{ marginLeft: '6px', fontSize: '11px', background: '#f8d7da', color: '#721c24', padding: '2px 6px', borderRadius: '4px' }}>LATE</span>}
                                        </td>
                                        <td style={{ ...tdStyle, color: balance > 0 ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                                            ₱{balance.toLocaleString()}
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={isLate ? badgeRed : badgeGreen}>
                                                {isLate ? 'Overdue' : 'Due Today'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button onClick={() => handleProcessClick(g)} style={btnOutline}>
                                                Process Checkout
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
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
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalCardStyle = { background: '#fff', padding: '30px', borderRadius: '8px', width: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const groupStyle = { display: 'flex', flexDirection: 'column' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' };
const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', fontSize: '14px' };
const readOnlyInput = { ...inputStyle, background: '#f9f9f9', border: '1px solid #eee', color: '#555' };
const closeBtnStyle = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' };
const btnRed = { gridColumn: 'span 2', padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '15px' };
const btnOutline = { padding: '6px 12px', background: 'white', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' };
const btnBlue = { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const btnGrey = { padding: '10px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const tabBase = { padding: '12px 25px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' };
const tabActive = { ...tabBase, background: '#28a745', color: 'white' };
const tabActiveRed = { ...tabBase, background: '#dc3545', color: 'white' };
const tabActiveBlue = { ...tabBase, background: '#007bff', color: 'white' };
const tabInactive = { ...tabBase, background: '#e0e0e0', color: '#666' };
const thStyle = { padding: '15px', textAlign: 'left', fontSize: '13px', color: '#444', fontWeight: 'bold' };
const tdStyle = { padding: '15px', textAlign: 'left', fontSize: '14px', color: '#333' };
const badgeGreen = { background: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' };
const badgeRed = { background: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' };
