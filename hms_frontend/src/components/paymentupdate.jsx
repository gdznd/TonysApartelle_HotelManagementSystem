import React, { useState, useEffect } from 'react';

export default function PaymentUpdate() {
    // --- STATE ---
    const [payments, setPayments] = useState([]); // Empty initially
    const [activeTab, setActiveTab] = useState('Unpaid');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Loading state

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

    // --- LOGIC (Same as before) ---
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
            // Send update to Python Backend
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
                fetchPayments(); // Refresh table from DB to be sure
            } else {
                alert("Failed to update database.");
            }
        } catch (error) {
            console.error("Error updating:", error);
            alert("Connection error.");
        }
    };

    // ... (The rest of your Return/JSX HTML remains exactly the same) ...
    // Just make sure to handle the "isLoading" state in the UI if you want (optional)
    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
             {/* ... header ... */}
             
             {/* Add a simple loading indicator */}
             {isLoading ? <p>Loading data from TiDB...</p> : (
                 <>
                    {/* ... The rest of your JSX (Form, Tabs, Table) goes here ... */}
                 </>
             )}
        </div>
    );
}