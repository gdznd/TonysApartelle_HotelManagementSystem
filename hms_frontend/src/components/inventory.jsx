import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:5000';

export default function Inventory() {
    const [selectedRoom, setSelectedRoom]         = useState('');
    const [rooms, setRooms]                       = useState([]);
    const [roomAmenities, setRoomAmenities]       = useState([]);
    const [supplies, setSupplies]                 = useState([]);
    const [generating, setGenerating]             = useState(false);
    const [loadingAmenities, setLoadingAmenities] = useState(false);

    // Load rooms and supplies on mount
    useEffect(() => {
        axios.get(`${API}/api/rooms`)
            .then(res => {
                setRooms(res.data);
                if (res.data.length > 0) setSelectedRoom(res.data[0].id);
            })
            .catch(err => console.error(err));

        axios.get(`${API}/api/supplies`)
            .then(res => setSupplies(res.data))
            .catch(err => console.error(err));
    }, []);

    // Load amenities whenever selected room changes
    useEffect(() => {
        if (!selectedRoom) return;
        setLoadingAmenities(true);
        axios.get(`${API}/api/rooms/${selectedRoom}/amenities`)
            .then(res => setRoomAmenities(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoadingAmenities(false));
    }, [selectedRoom]);

    // Download PDF from backend
    const handleDownload = () => {
        setGenerating(true);
        axios.get(`${API}/api/inventory/report`, { responseType: 'blob' })
            .then(res => {
                const url     = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                const link    = document.createElement('a');
                const date    = new Date().toISOString().slice(0, 10);
                link.href     = url;
                link.download = `Inventory_Report_${date}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => alert('Error generating report. Make sure the Flask server is running.'))
            .finally(() => setGenerating(false));
    };

    // Status badge config — matches your DB enum: 'In Stock','Low Stock','Unavailable'
    const getSupplyStatus = (supply) => {
        if (!supply.status) return { label: 'In Stock', color: '#28a745' };
        switch (supply.status) {
            case 'In Stock':    return { label: 'In Stock',      color: '#28a745' };
            case 'Low Stock':   return { label: 'Restock Alert', color: '#dc3545' };
            case 'Unavailable': return { label: 'Unavailable',   color: '#6c757d' };
            default:            return { label: supply.status,   color: '#ffc107' };
        }
    };

    // Amenity status based on quantity
    const getAmenityStatus = (qty) => {
        if (qty === 0) return { label: 'Missing',  color: '#dc3545' };
        if (qty === 1) return { label: 'Low',      color: '#ffc107' };
        return              { label: 'OK',         color: '#28a745' };
    };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
            <h2 style={{ color: '#333', marginBottom: '4px' }}>Module 11: Inventory Report of Amenities</h2>
            <p style={{ color: '#888', fontSize: '13px', marginTop: 0, marginBottom: '24px' }}>
                Inventory data is automatically tracked from Module 2 (Amenities) and Module 4 (Supplies).
            </p>

            {/* TWO-COLUMN LAYOUT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>

                {/* LEFT: Room Inventory Check */}
                <div style={cardStyle}>
                    <h3 style={sectionHeader('#007bff')}>🏨 Room Inventory Check</h3>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Select Room</label>
                        <select
                            style={inputStyle}
                            value={selectedRoom}
                            onChange={e => setSelectedRoom(e.target.value)}
                        >
                            {rooms.map(r => (
                                <option key={r.id} value={r.id}>
                                    Room {r.room_number} ({r.room_type})
                                </option>
                            ))}
                        </select>
                    </div>

                    {loadingAmenities ? (
                        <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
                            Loading amenities...
                        </p>
                    ) : (
                        <table style={tableStyle}>
                            <thead>
                                <tr style={{ background: '#f0f0f0' }}>
                                    <th style={thStyle}>Amenity Name</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Qty</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                                    <th style={thStyle}>Last Checked</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roomAmenities.map((a, i) => {
                                    const status = getAmenityStatus(a.quantity);
                                    return (
                                        <tr key={a.id} style={{
                                            background: i % 2 === 0 ? 'white' : '#fafafa',
                                            borderBottom: '1px solid #eee'
                                        }}>
                                            <td style={tdStyle}>{a.name}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>
                                                {a.quantity}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '4px',
                                                    fontSize: '11px', fontWeight: 'bold',
                                                    background: status.color, color: 'white'
                                                }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, fontSize: '12px', color: '#888' }}>
                                                {new Date().toISOString().slice(0, 10)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {roomAmenities.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                                            No amenities assigned to this room.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* RIGHT: Apartelle-wide Supplies */}
                <div style={cardStyle}>
                    <h3 style={sectionHeader('#28a745')}>📦 Apartelle-wide Items (Supplies)</h3>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '-8px', marginBottom: '12px' }}>
                        Physical inventory count: every 30 days
                    </p>

                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ background: '#f0f0f0' }}>
                                <th style={thStyle}>Item Name</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Unit Cost</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplies.map((s, i) => {
                                const st = getSupplyStatus(s);
                                return (
                                    <tr key={s.id} style={{
                                        background: i % 2 === 0 ? 'white' : '#fafafa',
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        <td style={tdStyle}>{s.name}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>
                                            {s.cost ? `₱${parseFloat(s.cost).toLocaleString()}` : '—'}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '4px',
                                                fontSize: '11px', fontWeight: 'bold',
                                                background: st.color, color: 'white'
                                            }}>
                                                {st.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {supplies.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                                        No supplies found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* GENERATE PDF BUTTON */}
            <div style={{ ...cardStyle, textAlign: 'center', maxWidth: '500px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>📊 Generate Full Inventory Report</h3>
                <p style={{ fontSize: '13px', color: '#777', marginBottom: '20px' }}>
                    Downloads a PDF covering all rooms, amenities, and supplies.
                </p>
                <button
                    onClick={handleDownload}
                    disabled={generating}
                    style={{
                        ...btnStyle,
                        opacity: generating ? 0.7 : 1,
                        cursor: generating ? 'not-allowed' : 'pointer'
                    }}
                >
                    {generating ? '⏳ Generating...' : '🖨️  Download PDF Report'}
                </button>
                {generating && (
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                        Building your report, please wait...
                    </p>
                )}
            </div>
        </div>
    );
}

// --- HELPERS ---
const sectionHeader = (color) => ({
    color,
    marginTop: 0,
    marginBottom: '16px',
    fontSize: '15px',
    borderBottom: `2px solid ${color}`,
    paddingBottom: '8px'
});

// --- STYLES ---
const cardStyle  = { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #eee' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' };
const thStyle    = { padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#555', borderBottom: '2px solid #eee' };
const tdStyle    = { padding: '8px 10px', verticalAlign: 'middle', color: '#333' };
const btnStyle   = { display: 'inline-block', padding: '14px 30px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', boxShadow: '0 4px 8px rgba(0,123,255,0.25)' };