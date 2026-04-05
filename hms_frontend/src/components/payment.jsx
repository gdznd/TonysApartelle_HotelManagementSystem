import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BASE_URL = 'http://127.0.0.1:5000';

export default function Payment() {
    const [searchId, setSearchId] = useState('');
    const [suggestions, setSuggestions] = useState([]); // NEW: stores live search results
    const [bookingData, setBookingData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountToPay, setAmountToPay] = useState('');
    const [cashReceived, setCashReceived] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [paymentLogged, setPaymentLogged] = useState(false);

    // --- HELPER: GENERATE RECEIPT ID (MMDDYYYYHHMMSS) ---
    const generateReceiptID = () => {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(now.getMonth()+1)}${pad(now.getDate())}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    };

    // --- LIVE SEARCH (AS YOU TYPE) ---
    useEffect(() => {
        // Only run live search if user typed at least 2 characters and no booking is selected yet
        const delayDebounceFn = setTimeout(async () => {
            if (searchId.trim().length >= 2 && !bookingData) {
                setIsSearching(true);
                try {
                    const response = await fetch(`${BASE_URL}/api/bookings/ref/${searchId.trim()}`);
                    if (response.ok) {
                        const data = await response.json();
                        setSuggestions(data); // Populate the "Do you mean:" list
                    } else {
                        setSuggestions([]);
                    }
                } catch (error) {
                    setSuggestions([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 300); // 300ms delay prevents spamming the server while typing

        return () => clearTimeout(delayDebounceFn);
    }, [searchId, bookingData]);

    // Handle typing in the search box
    const handleSearchChange = (e) => {
        setSearchId(e.target.value);
        if (bookingData) {
            setBookingData(null); // Clear active bill if user starts a new search
        }
    };

    // Fallback for the manual "Find Booking" button
    const handleSearch = () => {
        if (suggestions.length === 1) {
            handleSelectBooking(suggestions[0]);
        } else if (suggestions.length === 0) {
            alert("No matching bookings found.");
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    // --- LOAD SELECTED BOOKING INTO BILL SUMMARY ---
    const handleSelectBooking = (selected) => {
        setBookingData({
            id: selected.id,
            booking_reference: selected.booking_reference,
            guestName: selected.guest_name,
            roomType: selected.room_type,
            totalAmount: parseFloat(selected.total_amount),
            amountPaid: parseFloat(selected.amount_paid),
            remainingBalance: parseFloat(selected.balance),
        });
        setReceiptNumber(generateReceiptID());
        setAmountToPay('');
        setCashReceived('');
        setPaymentLogged(false);
        setSuggestions([]); // Hide suggestions box
        setSearchId(selected.booking_reference); // Put exact ID in the text box neatly
    };

    // --- CALCULATE CHANGE ---
    const changeDue = (parseFloat(cashReceived) > 0 && parseFloat(amountToPay) > 0)
        ? Math.max(0, parseFloat(cashReceived) - parseFloat(amountToPay)).toFixed(2)
        : '0.00';

    // --- LOG PAYMENT: POST TO BACKEND ---
    const handleLogPayment = async () => {
        if (!amountToPay || parseFloat(amountToPay) <= 0) {
            alert("Please enter a valid amount to pay.");
            return;
        }
        if (parseFloat(amountToPay) > bookingData.remainingBalance) {
            alert(`Amount cannot exceed remaining balance of ₱${bookingData.remainingBalance.toLocaleString()}.`);
            return;
        }
        if (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived) <= 0)) {
            alert("Please enter the Cash Received amount.");
            return;
        }
        if (paymentMethod === 'Cash' && parseFloat(cashReceived) < parseFloat(amountToPay)) {
            alert("Cash received cannot be less than the amount to pay.");
            return;
        }

        setIsLogging(true);
        try {
            const response = await fetch(`${BASE_URL}/api/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: bookingData.booking_reference,
                    receipt_number: receiptNumber,
                    payment_method: paymentMethod,
                    amount_paid: parseFloat(amountToPay),
                    cash_received: parseFloat(cashReceived) || 0,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                alert(`Error: ${err.message || 'Failed to log payment.'}`);
                return;
            }

            const result = await response.json();

            // Update the bill summary live with new values from backend
            setBookingData(prev => ({
                ...prev,
                amountPaid: parseFloat(result.new_amount_paid),
                remainingBalance: parseFloat(result.new_balance),
            }));

            setPaymentLogged(true);
            alert(`✅ Payment Logged!\nReceipt #: ${receiptNumber}\nAmount Paid: ₱${parseFloat(amountToPay).toLocaleString()}\nNew Balance: ₱${parseFloat(result.new_balance).toLocaleString()}`);

        } catch (error) {
            console.error("Log payment error:", error);
            alert("Could not connect to server.");
        } finally {
            setIsLogging(false);
        }
    };

    // --- ISSUE PDF RECEIPT ---
    const handleIssueReceipt = () => {
        if (!bookingData || !paymentLogged) {
            alert("Please log a payment first before issuing a receipt.");
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("OFFICIAL RECEIPT", 105, 20, null, null, "center");
        doc.setFontSize(12);
        doc.text("Hotel Management System", 105, 30, null, null, "center");
        doc.text(`Receipt #: ${receiptNumber}`, 14, 50);
        doc.text(`Date: ${new Date().toLocaleString()}`, 14, 58);
        doc.text(`Guest: ${bookingData.guestName}`, 14, 66);
        doc.text(`Booking Ref: ${bookingData.booking_reference}`, 14, 74);
        doc.text(`Room: ${bookingData.roomType}`, 14, 82);

        autoTable(doc, {
            startY: 95,
            head: [['Description', 'Amount']],
            body: [
                ['Total Bill', `P ${bookingData.totalAmount.toLocaleString()}`],
                ['Payment Method', paymentMethod],
                ['Amount Paid This Transaction', `P ${parseFloat(amountToPay).toLocaleString()}`],
                ['Cash Received', `P ${parseFloat(cashReceived || 0).toLocaleString()}`],
                ['Change Due', `P ${changeDue}`],
                ['Remaining Balance', `P ${bookingData.remainingBalance.toLocaleString()}`],
            ],
        });

        doc.text("Thank you for staying with us!", 105, 175, null, null, "center");
        doc.save(`Receipt_${receiptNumber}.pdf`);
    };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Module 6: Payment & Receipt</h2>

            {/* SECTION 1: FIND BOOKING */}
            <div style={cardStyle}>
                <h4 style={{ color: '#007bff', marginBottom: '15px' }}>Find Booking to Pay</h4>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Search (Name, Date, or Partial ID)</label>
                        <input
                            type="text"
                            placeholder="e.g., Kiana, 2026-04-04, or 1234"
                            value={searchId}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            style={inputStyle}
                        />
                        {/* NEW: CASE SENSITIVITY WARNING */}
                        <p style={{ fontSize: '12px', color: '#dc3545', marginTop: '5px', marginBottom: '0' }}>
                            * Note: Name searches are case-sensitive (e.g. type <strong>Kia</strong>, not kia).
                        </p>
                    </div>
                    <button onClick={handleSearch} style={btnBlue} disabled={isSearching}>
                        {isSearching ? 'Searching...' : 'Find Booking'}
                    </button>
                </div>
            </div>

            {/* NEW: "DO YOU MEAN" SUGGESTIONS LIST */}
            {suggestions.length > 0 && !bookingData && (
                <div style={{ ...cardStyle, marginTop: '15px' }}>
                    <h5 style={{ color: '#555', marginBottom: '15px' }}>Do you mean:</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {suggestions.map((s) => (
                            <div 
                                key={s.id} 
                                onClick={() => handleSelectBooking(s)}
                                style={{ 
                                    padding: '12px 15px', 
                                    backgroundColor: '#f8f9fa', 
                                    border: '1px solid #ddd',
                                    borderRadius: '6px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold',
                                    color: '#007bff',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            >
                                {s.booking_reference} — {s.guest_name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {bookingData && (
                <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>

                    {/* SECTION 2: BILL SUMMARY */}
                    <div style={{ ...cardStyle, flex: 1, minWidth: '300px' }}>
                        <h4 style={{ color: '#007bff', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            Bill Summary — {bookingData.guestName}
                        </h4>
                        <div style={{ marginTop: '15px', color: '#555', lineHeight: '2' }}>
                            <div><strong>Room:</strong> {bookingData.roomType}</div>
                            <div><strong>Total Due:</strong> ₱{bookingData.totalAmount.toLocaleString()}</div>
                            <div style={{ color: '#28a745' }}><strong>Amount Paid:</strong> ₱{bookingData.amountPaid.toLocaleString()}</div>
                        </div>
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', borderLeft: '4px solid #007bff' }}>
                            <div style={{ fontSize: '14px', color: '#666' }}>Remaining Balance</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: bookingData.remainingBalance === 0 ? '#28a745' : '#333' }}>
                                ₱{bookingData.remainingBalance.toLocaleString()}
                            </div>
                            {bookingData.remainingBalance === 0 && (
                                <div style={{ color: '#28a745', fontWeight: 'bold', marginTop: '5px' }}>✅ Fully Paid</div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: LOG PAYMENT */}
                    <div style={{ ...cardStyle, flex: 1.5, minWidth: '300px' }}>
                        <h4 style={{ color: '#007bff', marginBottom: '15px' }}>Log New Payment</h4>

                        {/* Row 1: Method & Receipt ID */}
                        <div style={rowStyle}>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Payment Method</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputStyle}>
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
                                <label style={labelStyle}>Amount to Pay Now (₱)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amountToPay}
                                    onChange={(e) => { setAmountToPay(e.target.value); setPaymentLogged(false); }}
                                    style={inputStyle}
                                    min="0"
                                    max={bookingData.remainingBalance}
                                    autoComplete="off"
                                />
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Cash Received (₱)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    style={inputStyle}
                                    disabled={paymentMethod !== 'Cash'}
                                    autoComplete="off"
                                />
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Change Due (₱)</label>
                                <input
                                    type="text"
                                    value={paymentMethod === 'Cash' ? changeDue : 'N/A'}
                                    readOnly
                                    style={{ ...inputStyle, backgroundColor: '#f1f3f5' }}
                                />
                            </div>
                        </div>

                        {/* Row 3: Buttons */}
                        <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                            <button
                                onClick={handleLogPayment}
                                style={{ ...btnBase, backgroundColor: isLogging ? '#aaa' : '#28a745' }}
                                disabled={isLogging || bookingData.remainingBalance === 0}
                            >
                                {isLogging ? 'Saving...' : '✅ Log Payment'}
                            </button>
                            <button
                                onClick={handleIssueReceipt}
                                style={{ ...btnBase, backgroundColor: paymentLogged ? '#17a2b8' : '#aaa' }}
                                disabled={!paymentLogged}
                                title={!paymentLogged ? 'Log a payment first' : 'Download PDF receipt'}
                            >
                                📄 Issue Receipt
                            </button>
                        </div>
                        {!paymentLogged && (
                            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                                * Log a payment above to enable receipt download.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- STYLES ---
const cardStyle = { background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#444' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' };
const rowStyle = { display: 'flex', gap: '15px', marginBottom: '15px' };
const groupStyle = { flex: 1 };
const btnBase = { flex: 1, padding: '12px', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' };
const btnBlue = { ...btnBase, backgroundColor: '#007bff', flex: 'none', width: '150px' };
