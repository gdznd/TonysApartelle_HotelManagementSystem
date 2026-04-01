import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const BASE_URL = 'http://127.0.0.1:5000';
const PIE_COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8'];

export default function IncomeReport() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterBy, setFilterBy] = useState('Monthly');

    // --- FETCH REPORT DATA ---
    const fetchReport = useCallback(async (sd, ed, fb) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (sd) params.append('start_date', sd);
            if (ed) params.append('end_date', ed);
            params.append('filter_by', fb);

            const response = await fetch(`${BASE_URL}/api/reports/income?${params.toString()}`);
            if (!response.ok) throw new Error('Server returned an error');
            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error("Error fetching income report:", err);
            setError("Could not load report. Is the Flask server running?");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReport('', '', 'Monthly');
    }, [fetchReport]);

    const handleFilter = () => {
        if (startDate && endDate && startDate > endDate) {
            alert("Start date cannot be after end date.");
            return;
        }
        fetchReport(startDate, endDate, filterBy);
    };

    const peso = (val) =>
        `\u20b1${parseFloat(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    const pesoShort = (val) =>
        `\u20b1${parseFloat(val || 0).toLocaleString()}`;

    return (
        <>
            <style>{`
                :root {
                    --primary-color: #007bff; --secondary-color: #6c757d;
                    --success-color: #28a745; --bg-color: #f8f9fa;
                    --card-bg: #ffffff; --border-color: #dee2e6;
                    --border-radius: 8px; --shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .system-container { max-width: 1200px; margin: 20px auto; padding: 20px; }
                .page-section { background-color: var(--card-bg); border-radius: var(--border-radius); box-shadow: var(--shadow); padding: 25px; margin-bottom: 30px; }
                .page-section-title { font-size: 1.8em; font-weight: 700; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
                .page-section-subtitle { font-size: 1.3em; font-weight: 600; color: var(--primary-color); margin-bottom: 15px; margin-top: 10px; }
                .bordered-section { border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 20px; margin-top: 25px; }
                .bordered-section-title { font-size: 1.1em; font-weight: 600; color: var(--secondary-color); margin-bottom: 15px; }
                .form-group { margin-bottom: 0; }
                .form-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.9em; }
                .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1em; box-sizing: border-box; }
                .button { padding: 10px 20px; border: none; border-radius: 6px; font-size: 1em; font-weight: 600; cursor: pointer; background-color: var(--primary-color); color: white; transition: opacity 0.2s; white-space: nowrap; }
                .button:hover { opacity: 0.85; }
                .button:disabled { background-color: #aaa; cursor: not-allowed; }
                .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 20px; margin-top: 25px; }
                .kpi-card { background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 20px; }
                .kpi-title { font-size: 0.82em; font-weight: 600; color: var(--secondary-color); text-transform: uppercase; letter-spacing: 0.5px; }
                .kpi-value { font-size: 1.8em; font-weight: 700; color: var(--primary-color); margin-top: 6px; }
                .two-column-layout { display: flex; flex-wrap: wrap; gap: 25px; }
                .two-column-layout > div { flex: 1; min-width: 300px; }
                .styled-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                .styled-table th, .styled-table td { border: 1px solid var(--border-color); padding: 12px 15px; text-align: left; font-size: 0.9em; }
                .styled-table th { background-color: var(--bg-color); font-weight: 600; }
                .empty-chart { height: 300px; display: flex; align-items: center; justify-content: center; color: #aaa; border: 1px dashed var(--border-color); border-radius: var(--border-radius); }
                .error-box { padding: 20px; background: #fff3f3; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24; text-align: center; margin-top: 20px; }
            `}</style>

            <main className="system-container">
                <section className="page-section">
                    <h2 className="page-section-title">Module 13: Income Report Dashboard</h2>

                    {/* FILTER */}
                    <div className="bordered-section">
                        <h3 className="page-section-subtitle">Date Range Filter</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '40px', alignItems: 'flex-end' }}>
                            <div className="form-group">
                                <label>Start Date</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Group By</label>
                                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                </select>
                            </div>
                            <button className="button" onClick={handleFilter} disabled={isLoading} style={{ alignSelf: 'flex-end' }}>
                                {isLoading ? 'Loading...' : 'Filter Report'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-box">⚠️ {error}</div>}

                    {isLoading && (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
                            Loading report data...
                        </div>
                    )}

                    {!isLoading && !error && data && (
                        <>
                            {/* KPI CARDS */}
                            <div className="kpi-grid">
                                <div className="kpi-card">
                                    <div className="kpi-title">Total Revenue</div>
                                    <div className="kpi-value">{pesoShort(data.total_revenue)}</div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-title">Occupancy Rate</div>
                                    <div className="kpi-value">{parseFloat(data.occupancy_rate || 0).toFixed(1)}%</div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-title">Avg. Daily Rate (ADR)</div>
                                    <div className="kpi-value">{pesoShort(data.adr)}</div>
                                </div>
                                <div className="kpi-card">
                                    <div className="kpi-title">RevPAR</div>
                                    <div className="kpi-value">{pesoShort(data.revpar)}</div>
                                </div>
                            </div>

                            {/* CHARTS + SUMMARY */}
                            <div className="bordered-section" style={{ marginTop: '20px' }}>
                                <h3 className="page-section-subtitle">Breakdown</h3>
                                <div className="two-column-layout">

                                    {/* BAR CHART */}
                                    <div>
                                        <h4 className="bordered-section-title">Income by Room Type</h4>
                                        {data.income_by_room_type && data.income_by_room_type.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={data.income_by_room_type} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="room_type" tick={{ fontSize: 12 }} />
                                                    <YAxis tickFormatter={(v) => `\u20b1${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                                                    <Tooltip formatter={(val) => peso(val)} labelFormatter={(l) => `Room: ${l}`} />
                                                    <Bar dataKey="total" name="Income" fill="#007bff" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="empty-chart">No room type data available</div>
                                        )}
                                    </div>

                                    {/* PIE CHART */}
                                    <div>
                                        <h4 className="bordered-section-title">Income by Payment Method</h4>
                                        {data.income_by_payment_method && data.income_by_payment_method.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={data.income_by_payment_method}
                                                        dataKey="total"
                                                        nameKey="payment_method"
                                                        cx="50%" cy="50%"
                                                        outerRadius={100}
                                                        label={({ payment_method, percent }) =>
                                                            `${payment_method} ${(percent * 100).toFixed(0)}%`
                                                        }
                                                    >
                                                        {data.income_by_payment_method.map((_, i) => (
                                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(val) => peso(val)} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="empty-chart">No payment method data available</div>
                                        )}
                                    </div>
                                </div>

                                {/* SUMMARY TABLE */}
                                <h3 className="page-section-subtitle" style={{ marginTop: '25px' }}>Summary</h3>
                                <table className="styled-table">
                                    <thead>
                                        <tr><th>Category</th><th>Amount</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Room Charges</td><td>{peso(data.room_charges)}</td></tr>
                                        <tr><td>Additional Services Income</td><td>{peso(data.services_income)}</td></tr>
                                        <tr><td>Refunds / Deductions</td><td style={{ color: '#dc3545' }}>({peso(data.refunds)})</td></tr>
                                        <tr><td>Damages Collected</td><td>{peso(data.damages_collected)}</td></tr>
                                        <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-color)' }}>
                                            <td>Gross Revenue</td>
                                            <td style={{ color: '#28a745' }}>{peso(data.total_revenue)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    <button
                        className="button"
                        style={{ marginTop: '25px', backgroundColor: '#28a745' }}
                        disabled={!data || isLoading}
                        onClick={() => alert('Connect this to your Flask PDF/Excel export endpoint.')}
                    >
                        📥 Export Report (PDF/Excel)
                    </button>
                </section>
            </main>
        </>
    );
}
