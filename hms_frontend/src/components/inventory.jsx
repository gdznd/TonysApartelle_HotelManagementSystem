import React from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Inventory() {

    const generatePDF = () => {
        axios.get('http://127.0.0.1:5000/api/inventory/report')
            .then(res => {
                const { amenities, supplies } = res.data;
                const doc = new jsPDF();

                // -- TITLE --
                doc.setFontSize(20);
                doc.setTextColor(40);
                doc.text("Hotel Inventory Report", 14, 22);
                
                doc.setFontSize(11);
                doc.setTextColor(100);
                const date = new Date().toLocaleString();
                doc.text(`Generated on: ${date}`, 14, 30);

                // -- SECTION 1: AMENITIES --
                doc.setFontSize(14);
                doc.setTextColor(0);
                doc.text("1. Room Amenities", 14, 45);

                const amenitiesRows = amenities.map(item => [
                    item.name || item.amenity_name, 
                    item.quantity || item.stock_qty || 0, 
                    item.status || (item.quantity < 50 ? "Restock" : "OK")
                ]);

                doc.autoTable({
                    startY: 50,
                    head: [['Item Name', 'Current Stock', 'Status']],
                    body: amenitiesRows,
                    theme: 'striped',
                    headStyles: { fillColor: [22, 160, 133] } // Green header
                });

                // -- SECTION 2: SUPPLIES / ASSETS --
                // Calculate Y position based on where the first table ended
                const finalY = doc.lastAutoTable.finalY + 20;
                
                doc.setFontSize(14);
                doc.text("2. General Supplies & Assets", 14, finalY - 5);

                const suppliesRows = supplies.map(item => [
                    item.name || item.item_name,
                    item.quantity || item.stock || 0,
                    item.status || "OK"
                ]);

                doc.autoTable({
                    startY: finalY,
                    head: [['Asset / Supply', 'Quantity', 'Condition / Status']],
                    body: suppliesRows,
                    theme: 'striped',
                    headStyles: { fillColor: [41, 128, 185] } // Blue header
                });

                // -- FOOTER --
                doc.setFontSize(10);
                doc.text("End of Report", 14, doc.lastAutoTable.finalY + 20);

                // Save File
                doc.save(`Inventory_Report_${Date.now()}.pdf`);
            })
            .catch(err => alert("Error generating report. Check console."));
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
            <h2>Module 11: Inventory Management</h2>
            <p style={{ color: '#666' }}>
                Inventory data is automatically tracked from Module 2 (Amenities) and Module 4 (Supplies).
            </p>

            <div style={cardStyle}>
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Monthly Inventory Report</h3>
                    <p style={{ fontSize: '14px', color: '#777' }}>
                        Generates a PDF summary of all room amenities, consumables, and fixed assets.
                    </p>
                </div>
                
                <button onClick={generatePDF} style={btnStyle}>
                    🖨️ Download PDF Report
                </button>
            </div>
        </div>
    );
}

// --- STYLES ---
const cardStyle = {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    textAlign: 'center',
    border: '1px solid #eee'
};

const btnStyle = {
    padding: '15px 30px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,123,255,0.3)',
    transition: 'background 0.2s'
};