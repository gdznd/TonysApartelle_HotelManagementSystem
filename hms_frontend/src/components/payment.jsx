import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Payment() {
    // --- STATE VARIABLES ---
    const [searchId, setSearchId] = useState('');
    const [bookingData, setBookingData] = useState(null);
    
    // Payment Form States
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountToPay, setAmountToPay] = useState('');
    const [cashReceived, setCashReceived] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');

    // --- HELPER: GENERATE TIMESTAMP ID ---
    // Format: MMDDYYYYHHMMSS (e.g., 02182026184132)
    const generateReceiptID = () => {
        const now = new Date();
        const pad = (num) => num.toString().padStart(2, '0');
        
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const year = now.getFullYear();
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());

        return `${month}${day}${year}${hours}${minutes}${seconds}`;
    };

    // --- SEARCH FUNCTION (MOCK) ---
    const handleSearch = () => {
        // In the future, this will be: axios.get(`/api/bookings/${searchId}`)
        // For now, we simulate finding a booking:
        if (searchId) {
            setBookingData({
                id: searchId,
                guestName: "John Doe", // Mock Data
                roomType: "Deluxe Suite - Room 302",
                totalAmount: 6180.00,
                amountPaid: 0.00,
                remainingBalance: 6180.00
            });
            // Generate a fresh Receipt ID whenever we start a new transaction
            setReceiptNumber(generateReceiptID());
            setAmountToPay(''); // Reset form
            setCashReceived('');
        } else {
            alert("Please enter a Booking ID");
        }
    };

    // --- CALCULATE CHANGE ---
    const changeDue = cashReceived && amountToPay 
        ? (parseFloat(cashReceived) - parseFloat(amountToPay)).toFixed(2) 
        : '0.00';

    // --- ACTION: LOG PAYMENT ---
    const handleLogPayment = () => {
        if (!amountToPay || parseFloat(amountToPay) <= 0) {
            alert("Please enter a valid amount to pay.");
            return;
        }
        alert(`✅ Payment Logged!\nID: ${receiptNumber}\nAmount: ₱${amountToPay}\nBalance Updated.`);
        // Here we will eventually add axios.post('/api/payments', ...)
    };

    // --- ACTION: ISSUE RECEIPT ---
    const handleIssueReceipt = () => {
        if (!bookingData) return;

        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text("OFFICIAL RECEIPT", 105, 20, null, null, "center");
        doc.setFontSize(12);
        doc.text("Hotel Management System", 105, 30, null, null, "center");

        // Receipt Details
        doc.text(`Receipt #: ${receiptNumber}`, 14, 50);
        doc.text(`Date: ${new Date().toLocaleString()}`, 14, 58);
        doc.text(`Guest: ${bookingData.guestName}`, 14, 66);
        doc.text(`Booking Ref: ${bookingData.id}`, 14, 74);

        // Table
        doc.autoTable({
            startY: 85,
            head: [['Description', 'Amount']],
            body: [
                ['Payment Amount', `P ${parseFloat(amountToPay).toLocaleString()}`],
                ['Payment Method', paymentMethod],
                ['Cash Received', `P ${parseFloat(cashReceived).toLocaleString()}`],
                ['Change Due', `P ${changeDue}`],
            ],
        });

        // Footer
        doc.text("Thank you for staying with us!", 105, 160, null, null, "center");
        
        doc.save(`Receipt_${receiptNumber}.pdf`);
    };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Module 6: Payment & Receipt</h2>

            {/* --- SECTION 1: FIND BOOKING --- */}
            <div style={cardStyle}>
                <h4 style={{ color: '#007bff', marginBottom: '15px' }}>Find Booking to Pay</h4>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Booking Reference ID</label>
                        <input 
                            type="text" 
                            placeholder="e.g., BK-12345" 
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            style={inputStyle} 
                        />
                    </div>
                    <button onClick={handleSearch} style={btnBlue}>Find Booking</button>
                </div>
            </div>

            {bookingData && (
                <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                    
                    {/* --- SECTION 2: BILL SUMMARY (LEFT) --- */}
                    <div style={{ ...cardStyle, flex: 1, minWidth: '300px' }}>
                        <h4 style={{ color: '#007bff', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            Bill Summary (for {bookingData.guestName})
                        </h4>
                        
                        <div style={{ marginTop: '15px', color: '#555', lineHeight: '1.8' }}>
                            <div><strong>Room:</strong> {bookingData.roomType}</div>
                            <div><strong>Total Due:</strong> ₱{bookingData.totalAmount.toLocaleString()}</div>
                            <div style={{ color: 'green' }}><strong>Amount Paid:</strong> ₱{bookingData.amountPaid.toLocaleString()}</div>
                        </div>

                        <div style={{ 
                            marginTop: '20px', 
                            padding: '15px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '5px',
                            borderLeft: '4px solid #007bff'
                        }}>
                            <div style={{ fontSize: '14px', color: '#666' }}>Remaining Balance</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                                ₱{bookingData.remainingBalance.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 3: LOG PAYMENT (RIGHT) --- */}
                    <div style={{ ...cardStyle, flex: 1.5, minWidth: '300px' }}>
                        <h4 style={{ color: '#007bff', marginBottom: '15px' }}>Log New Payment</h4>

                        {/* Row 1: Method & Receipt ID */}
                        <div style={rowStyle}>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Payment Method</label>
                                <select 
                                    value={paymentMethod} 
                                    onChange={(e) => setPaymentMethod(e.target.value)} 
                                    style={inputStyle}
                                >
                                    <option>Cash</option>
                                    <option>Credit Card</option>
                                    <option>GCash</option>
                                    <option>Bank Transfer</option>
                                </select>
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Receipt Number (Auto)</label>
                                <input 
                                    type="text" 
                                    value={receiptNumber} 
                                    readOnly 
                                    style={{ ...inputStyle, backgroundColor: '#e9ecef', color: '#666', cursor: 'not-allowed' }} 
                                />
                            </div>
                        </div>

                        {/* Row 2: Amounts */}
                        <div style={rowStyle}>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Amount to Pay Now</label>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={amountToPay}
                                    onChange={(e) => setAmountToPay(e.target.value)}
                                    style={inputStyle} 
                                />
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Cash Received</label>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Change Due</label>
                                <input 
                                    type="text" 
                                    value={changeDue} 
                                    readOnly 
                                    style={{ ...inputStyle, backgroundColor: '#f1f3f5' }} 
                                />
                            </div>
                        </div>

                        {/* Row 3: Buttons */}
                        <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                            <button onClick={handleLogPayment} style={{ ...btnBase, backgroundColor: '#28a745' }}>
                                ✅ Log Payment
                            </button>
                            <button onClick={handleIssueReceipt} style={{ ...btnBase, backgroundColor: '#17a2b8' }}>
                                📄 Issue Receipt
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

// --- STYLES ---
const cardStyle = {
    background: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #eaeaea'
};

const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#444'
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box' // Important for padding
};

const rowStyle = {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px'
};

const groupStyle = {
    flex: 1
};

const btnBase = {
    flex: 1,
    padding: '12px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.2s'
};

const btnBlue = {
    ...btnBase,
    backgroundColor: '#007bff',
    flex: 'none', // Don't stretch
    width: '150px'
};