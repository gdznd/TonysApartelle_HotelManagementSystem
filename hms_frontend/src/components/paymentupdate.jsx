import React, { useState, useEffect } from 'react';

const BASE_URL = 'http://127.0.0.1:5000';

export default function PaymentUpdate() {
    const [payments, setPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('Unpaid');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        id: null, booking_id: '', guest_name: '', room_id: '',
        total_amount: 0, amount_paid: 0, balance: 0, status: ''
    });

    // --- FETCH ALL PAYMENTS FROM BACKEND ---
    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/api/payments`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setPayments(data);
        } catch (error) {
            console.error("Error fetching payments:", error);
            alert("Could not load payment data. Is the server running?");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // --- FILTER: by tab status + search query ---
    const filteredPayments = payments.filter(p => {
        const matchesTab = p.status === activeTab;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            String(p.booking_id).toLowerCase().includes(q) ||
            String(p.guest_name).toLowerCase().includes(q) ||
            String(p.room_id).toLowerCase().includes(q);
        return matchesTab && matchesSearch;
    });

    // --- OPEN EDIT FORM ---
    const handleEditClick = (payment) => {
        setFormData({ ...payment });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- HANDLE AMOUNT PAID CHANGE (auto-calc balance) ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount_paid') {
            const newPaid = parseFloat(value) || 0;
            const newBalance = formData.total_amount - newPaid;
            setFormData(prev => ({
                ...prev,
                amount_paid: newPaid,
                balance: newBalance >= 0 ? newBalance : 0
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // --- SAVE UPDATE TO BACKEND ---
    const handleSave = async (e) => {
        e.preventDefault();

        // Determine status automatically
        let newStatus = 'Unpaid';
        if (formData.balance <= 0) newStatus = 'Fully Paid';
        else if (formData.amount_paid > 0) newStatus = 'Partially Paid';

        setIsSaving(true);
        try {
            const response = await fetch(`${BASE_URL}/api/payments/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: formData.id,
                    amount_paid: formData.amount_paid,
                    balance: formData.balance,   // ← send balance too so backend stores it
                    status: newStatus
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                alert(`Update failed: ${err.message || 'Unknown error'}`);
                return;
            }

            alert(`✅ Record Updated!\nGuest: ${formData.guest_name}\nNew Status: ${newStatus}`);
            setIsEditing(false);
            fetchPayments(); // Refresh table
        } catch (error) {
            console.error("Error updating:", error);
            alert("Connection error. Is the server running?");
        } finally {
            setIsSaving(false);
        }
    };

    // --- STATUS BADGE COLOR ---
    const statusColor = (status) => {
        if (status === 'Fully Paid') return '#28a745';
        if (status === 'Partially Paid') return '#ffc107';
        return '#dc3545'; // Unpaid
    };

    // --- TAB COUNTS ---
    const countFor = (tab) => payments.filter(p => p.status === tab).length;

    // --- STYLES ---
    const tabStyle = (tabName) => ({
        padding: '10px 20px', cursor: 'pointer', border: 'none',
        borderBottom: activeTab === tabName ? '3px solid #007bff' : '3px solid transparent',
        background: 'transparent',
        fontWeight: activeTab === tabName ? 'bold' : 'normal',
        color: activeTab === tabName ? '#007bff' : '#555',
        marginRight: '5px', fontSize: '14px'
    });
    const thStyle = { padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #ddd', backgroundColor: '#f8f9fa', fontSize: '13px', fontWeight: '600' };
    const tdStyle = { padding: '12px 15px', borderBottom: '1px solid #eee', fontSize: '14px' };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            <h2 style={{ color: '#333', marginBottom: '5px' }}>Module 11: Payment Update</h2>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>View and update payment records for existing bookings.</p>

            {/* --- EDIT FORM (shown when editing) --- */}
            {isEditing && (
                <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #dee2e6', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ color: '#007bff', marginBottom: '20px' }}>
                        Updating Payment — <span style={{ color: '#333' }}>{formData.guest_name}</span>
                        <span style={{ fontSize: '13px', color: '#888', marginLeft: '10px' }}>Booking #{formData.booking_id}</span>
                    </h3>
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={formLabelStyle}>Total Amount (₱)</label>
                                <input type="number" disabled value={formData.total_amount}
                                    style={{ ...formInputStyle, backgroundColor: '#e9ecef', cursor: 'not-allowed' }} />
                            </div>
                            <div>
                                <label style={formLabelStyle}>Amount Paid (₱) <span style={{ color: '#007bff' }}>← edit this</span></label>
                                <input
                                    type="number"
                                    name="amount_paid"
                                    value={formData.amount_paid}
                                    onChange={handleInputChange}
                                    style={{ ...formInputStyle, borderColor: '#007bff', outline: 'none' }}
                                    required
                                    min="0"
                                    max={formData.total_amount}
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label style={formLabelStyle}>Remaining Balance (₱)</label>
                                <input type="number" disabled value={formData.balance}
                                    style={{ ...formInputStyle, backgroundColor: '#e9ecef', cursor: 'not-allowed',
                                        color: formData.balance <= 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }} />
                            </div>
                        </div>

                        {/* Status preview */}
                        <div style={{ marginBottom: '20px', padding: '10px 15px', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '14px' }}>
                            <strong>New Status Preview: </strong>
                            <span style={{ color: statusColor(formData.balance <= 0 ? 'Fully Paid' : formData.amount_paid > 0 ? 'Partially Paid' : 'Unpaid'), fontWeight: 'bold' }}>
                                {formData.balance <= 0 ? 'Fully Paid' : formData.amount_paid > 0 ? 'Partially Paid' : 'Unpaid'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" disabled={isSaving}
                                style={{ padding: '10px 25px', background: isSaving ? '#aaa' : '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {isSaving ? 'Saving...' : '💾 Save Update'}
                            </button>
                            <button type="button" onClick={() => setIsEditing(false)}
                                style={{ padding: '10px 25px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- MAIN TABLE CARD --- */}
            <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #dee2e6' }}>

                {/* Tab bar + search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #dee2e6' }}>
                    <div>
                        {['Unpaid', 'Partially Paid', 'Fully Paid'].map(tab => (
                            <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
                                {tab} <span style={{ fontSize: '12px', color: '#888' }}>({countFor(tab)})</span>
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, booking ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', width: '220px' }}
                    />
                </div>

                {/* Table */}
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading payment records...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Booking ID</th>
                                <th style={thStyle}>Guest Name</th>
                                <th style={thStyle}>Room</th>
                                <th style={thStyle}>Total Amount</th>
                                <th style={thStyle}>Amount Paid</th>
                                <th style={thStyle}>Balance</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
                                        No {activeTab} records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map(payment => (
                                    <tr key={payment.id} style={{ transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f9fbff'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={tdStyle}>{payment.booking_id}</td>
                                        <td style={tdStyle}>{payment.guest_name}</td>
                                        <td style={tdStyle}>{payment.room_id}</td>
                                        <td style={tdStyle}>₱{parseFloat(payment.total_amount).toLocaleString()}</td>
                                        <td style={tdStyle}>₱{parseFloat(payment.amount_paid).toLocaleString()}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', color: payment.balance <= 0 ? '#28a745' : '#dc3545' }}>
                                            ₱{parseFloat(payment.balance).toLocaleString()}
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
                                                fontWeight: 'bold', color: 'white',
                                                backgroundColor: statusColor(payment.status)
                                            }}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={() => handleEditClick(payment)}
                                                disabled={payment.status === 'Fully Paid'}
                                                style={{
                                                    padding: '6px 14px', border: 'none', borderRadius: '5px', cursor: payment.status === 'Fully Paid' ? 'not-allowed' : 'pointer',
                                                    background: payment.status === 'Fully Paid' ? '#ccc' : '#007bff',
                                                    color: 'white', fontSize: '13px', fontWeight: 'bold'
                                                }}>
                                                {payment.status === 'Fully Paid' ? 'Paid' : 'Edit'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <p style={{ fontSize: '12px', color: '#aaa', marginTop: '15px' }}>
                Total records: {payments.length} | Showing: {filteredPayments.length}
            </p>
        </div>
    );
}

const formLabelStyle = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#555' };
const formInputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' };
