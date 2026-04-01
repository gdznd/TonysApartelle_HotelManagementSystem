import React, { useState, useEffect } from 'react';

export default function PaymentUpdate() {
    // --- STATE ---
    const [payments, setPayments] = useState([]); 
    const [activeTab, setActiveTab] = useState('Unpaid');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        id: null, booking_id: '', guest_name: '', room_id: '',
        total_amount: 0, amount_paid: 0, balance: 0, status: ''
    });

    // --- 1. FETCH DATA FROM BACKEND ---
    const fetchPayments = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/payments');
            const data = await response.json();
            setPayments(data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching payments:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments(); // Run on mount
    }, []);

    // --- LOGIC ---
    const filteredPayments = payments.filter(p => p.status === activeTab);

    const handleEditClick = (payment) => {
        setFormData(payment);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
            setFormData({ ...formData, [name]: value });
        }
    };

    // --- 2. SAVE TO BACKEND ---
    const handleSave = async (e) => {
        e.preventDefault();

        // Calculate new status
        let newStatus = 'Unpaid';
        if (formData.balance <= 0) newStatus = 'Fully Paid';
        else if (formData.amount_paid > 0) newStatus = 'Partially Paid';

        try {
            const response = await fetch('http://127.0.0.1:5000/api/payments/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: formData.id,
                    amount_paid: formData.amount_paid,
                    status: newStatus
                })
            });

            if (response.ok) {
                alert(`Record Updated!\nNew Status: ${newStatus}`);
                setIsEditing(false);
                fetchPayments(); // Refresh table from DB
            } else {
                alert("Failed to update database.");
            }
        } catch (error) {
            console.error("Error updating:", error);
            alert("Connection error.");
        }
    };

    // --- STYLES ---
    const tabStyle = (tabName) => ({
        padding: '10px 20px', cursor: 'pointer', border: 'none',
        borderBottom: activeTab === tabName ? '3px solid #007bff' : 'none',
        background: 'transparent', fontWeight: activeTab === tabName ? 'bold' : 'normal',
        marginRight: '10px'
    });
    const thStyle = { padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', backgroundColor: '#f8f9fa' };
    const tdStyle = { padding: '12px', borderBottom: '1px solid #ddd' };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
            <h2>Payment Update Module</h2>
            
            {isLoading ? <p>Loading data from TiDB...</p> : (
                <>
                    {/* --- UPDATE FORM --- */}
                    {isEditing && (
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
                            <h3>Update Payment for: {formData.guest_name}</h3>
                            <form onSubmit={handleSave} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                                <div>
                                    <label>Total Amount:</label><br/>
                                    <input type="number" disabled value={formData.total_amount} style={{ padding: '8px' }} />
                                </div>
                                <div>
                                    <label>Amount Paid:</label><br/>
                                    <input 
                                        type="number" 
                                        name="amount_paid" 
                                        value={formData.amount_paid} 
                                        onChange={handleInputChange} 
                                        style={{ padding: '8px', borderColor: '#007bff' }} 
                                        required 
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label>Remaining Balance:</label><br/>
                                    <input type="number" disabled value={formData.balance} style={{ padding: '8px' }} />
                                </div>
                                <div>
                                    <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        Save Update
                                    </button>
                                    <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* --- TABS --- */}
                    <div style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
                        <button style={tabStyle('Unpaid')} onClick={() => setActiveTab('Unpaid')}>Unpaid</button>
                        <button style={tabStyle('Partially Paid')} onClick={() => setActiveTab('Partially Paid')}>Partially Paid</button>
                        <button style={tabStyle('Fully Paid')} onClick={() => setActiveTab('Fully Paid')}>Fully Paid</button>
                    </div>

                    {/* --- DATA TABLE --- */}
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Booking ID</th>
                                <th style={thStyle}>Guest Name</th>
                                <th style={thStyle}>Room ID</th>
                                <th style={thStyle}>Total Amount</th>
                                <th style={thStyle}>Amount Paid</th>
                                <th style={thStyle}>Balance</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No records found for {activeTab}.</td></tr>
                            ) : (
                                filteredPayments.map(payment => (
                                    <tr key={payment.id}>
                                        <td style={tdStyle}>{payment.booking_id}</td>
                                        <td style={tdStyle}>{payment.guest_name}</td>
                                        <td style={tdStyle}>{payment.room_id}</td>
                                        <td style={tdStyle}>${payment.total_amount}</td>
                                        <td style={tdStyle}>${payment.amount_paid}</td>
                                        <td style={tdStyle}>${payment.balance}</td>
                                        <td style={tdStyle}>{payment.status}</td>
                                        <td style={tdStyle}>
                                            <button 
                                                onClick={() => handleEditClick(payment)} 
                                                style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}