import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function IncomeReport() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Colors for Pie Chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        axios.get('http://127.0.0.1:5000/api/reports/dashboard')
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching report:", err);
                setLoading(false);
                alert("Error loading report. Check Python console for details.");
            });
    };

    const generatePDF = () => {
        if (!data) return;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("HotelSys Income Report", 14, 20);
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

        doc.autoTable({
            startY: 40,
            head: [['Category', 'Amount']],
            body: [
                ['Room Charges', `P ${data.summary.room_charges.toLocaleString()}`],
                ['Services & Extras', `P ${data.summary.services.toLocaleString()}`],
                ['Damages & Fines', `P ${data.summary.damages.toLocaleString()}`],
                ['GROSS REVENUE', `P ${data.summary.gross.toLocaleString()}`],
            ],
        });
        doc.save('income_report.pdf');
    };

    if (loading) return <div>Loading Report...</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', background: '#f4f6f9' }}>
            <h2>Module 12: Income Report</h2>

            {/* 1. FILTERS (Visual Only for now) */}
            <div style={cardStyle}>
                <h4 style={{ margin: '0 0 15px 0', color: '#007bff' }}>Date Range Filter</h4>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <input type="date" style={inputStyle} />
                    <input type="date" style={inputStyle} />
                    <select style={inputStyle}>
                        <option>Monthly</option>
                        <option>Weekly</option>
                        <option>Yearly</option>
                    </select>
                    <button onClick={fetchData} style={btnBlue}>Filter Report</button>
                </div>
            </div>

            {/* 2. KEY METRICS CARDS */}
            <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
                <MetricCard title="TOTAL REVENUE" value={`₱${data.metrics.total_revenue.toLocaleString()}`} />
                <MetricCard title="OCCUPANCY RATE" value={`${data.metrics.occupancy_rate}%`} />
                <MetricCard title="AVG. DAILY RATE (ADR)" value={`₱${data.metrics.adr}`} />
                <MetricCard title="REVPAR" value={`₱${data.metrics.revpar}`} />
            </div>

            {/* 3. CHARTS SECTION */}
            <div style={{ ...cardStyle, display: 'flex', gap: '20px', height: '400px' }}>
                
                {/* Bar Chart: Room Types */}
                <div style={{ flex: 1 }}>
                    <h4 style={{ textAlign: 'center', color: '#555' }}>Income by Room Type</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.charts.room_type}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                            <Bar dataKey="value" fill="#8884d8" name="Revenue" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart: Payment Methods */}
                <div style={{ flex: 1 }}>
                    <h4 style={{ textAlign: 'center', color: '#555' }}>Income by Payment Method</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data.charts.payment_method}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {data.charts.payment_method.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 4. SUMMARY TABLE */}
            <div style={{ ...cardStyle, marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#007bff' }}>Summary</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <SummaryRow label="Room Charges Summary" amount={data.summary.room_charges} />
                        <SummaryRow label="Additional Services Income" amount={data.summary.services} />
                        <SummaryRow label="Damages Collected" amount={data.summary.damages} />
                        <tr style={{ background: '#e9ecef', fontWeight: 'bold' }}>
                            <td style={tdStyle}>Gross Revenue</td>
                            <td style={{...tdStyle, textAlign: 'right'}}>₱{data.summary.gross.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                
                <button onClick={generatePDF} style={{ ...btnBlue, marginTop: '20px' }}>
                    Export Report (PDF)
                </button>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS & STYLES ---

const MetricCard = ({ title, value }) => (
    <div style={{ 
        flex: 1, 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
        border: '1px solid #e0e0e0',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'bold', marginBottom: '5px' }}>{title}</div>
        <div style={{ fontSize: '28px', color: '#007bff', fontWeight: 'bold' }}>{value}</div>
    </div>
);

const SummaryRow = ({ label, amount }) => (
    <tr style={{ borderBottom: '1px solid #eee' }}>
        <td style={tdStyle}>{label}</td>
        <td style={{ ...tdStyle, textAlign: 'right' }}>₱{amount.toLocaleString()}</td>
    </tr>
);

const cardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e0e0e0'
};

const inputStyle = {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px'
};

const btnBlue = {
    padding: '8px 15px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const tdStyle = {
    padding: '12px',
    color: '#333'
};