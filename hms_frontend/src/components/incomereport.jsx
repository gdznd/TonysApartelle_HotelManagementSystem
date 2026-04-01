import React, { useState, useEffect } from 'react';

export default function IncomeReport() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/reports/income');
                const result = await response.json();
                setData(result);
                setIsLoading(false);
            } catch (error) {
                console.error("Error:", error);
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <>
            <style>{`
                :root {
                    --primary-color: #007bff;
                    --secondary-color: #6c757d;
                    --danger-color: #dc3545;
                    --success-color: #28a745;
                    --warning-color: #ffc107;
                    --info-color: #17a2b8;
                    --bg-color: #f8f9fa;
                    --card-bg: #ffffff;
                    --text-color: #333;
                    --border-color: #dee2e6;
                    --border-radius: 8px;
                    --shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }

                .system-container { max-width: 1200px; margin: 20px auto; padding: 20px; }
                .page-section { background-color: var(--card-bg); border-radius: var(--border-radius); box-shadow: var(--shadow); padding: 25px; margin-bottom: 30px; }
                .page-section-title { font-size: 1.8em; font-weight: 700; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
                .page-section-subtitle { font-size: 1.3em; font-weight: 600; color: var(--primary-color); margin-bottom: 15px; margin-top: 10px; }
                
                .bordered-section { border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 20px; margin-top: 25px; }
                .bordered-section-title { font-size: 1.1em; font-weight: 600; color: var(--secondary-color); margin-bottom: 15px; }
                
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.9em; }
                .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1em; }
                
                .button { padding: 10px 15px; border: none; border-radius: 6px; font-size: 1em; font-weight: 600; cursor: pointer; background-color: var(--primary-color); color: white; transition: opacity 0.2s; }
                .button:hover { opacity: 0.85; }

                .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
                .kpi-card { background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 20px; }
                .kpi-card .title { font-size: 0.9em; font-weight: 600; color: var(--secondary-color); text-transform: uppercase; }
                .kpi-card .value { font-size: 2.5em; font-weight: 700; color: var(--primary-color); }

                .two-column-layout { display: flex; flex-wrap: wrap; gap: 25px; }
                .two-column-layout > div { flex: 1; min-width: 300px; }

                .chart-placeholder { width: 100%; height: 300px; background-color: var(--bg-color); border: 1px dashed var(--border-color); border-radius: var(--border-radius); display: flex; align-items: center; justify-content: center; color: var(--secondary-color); }

                .styled-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                .styled-table th, .styled-table td { border: 1px solid var(--border-color); padding: 10px; text-align: left; font-size: 0.9em; }
                .styled-table th { background-color: var(--bg-color); font-weight: 600; }
            `}</style>

            <main className="system-container">
                <section className="page-section">
                    <h2 className="page-section-title">Module 12: Income Report</h2>

                    <div className="bordered-section">
                        <h3 className="page-section-subtitle">Date Range Filter</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '40px', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Start Date</label>
                                <input type="date" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>End Date</label>
                                <input type="date" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Filter</label>
                                <select defaultValue="Monthly">
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                </select>
                            </div>
                            <button type="button" className="button" style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>Filter Report</button>
                        </div>
                    </div>

                    <div className="kpi-grid" style={{ marginTop: '25px' }}>
                        <div className="kpi-card">
                            <div className="title">Total Revenue</div>
                            <div className="value">₱0</div>
                        </div>
                        <div className="kpi-card">
                            <div className="title">Occupancy Rate</div>
                            <div className="value">0%</div>
                        </div>
                        <div className="kpi-card">
                            <div className="title">Avg. Daily Rate (ADR)</div>
                            <div className="value">₱0</div>
                        </div>
                        <div className="kpi-card">
                            <div className="title">RevPAR</div>
                            <div className="value">₱0</div>
                        </div>
                    </div>

                    <div className="bordered-section" style={{ marginTop: '20px' }}>
                        <h3 className="page-section-subtitle">Breakdown</h3>
                        <div className="two-column-layout">
                            <div>
                                <h4 className="bordered-section-title">Income by Room Type</h4>
                                <div className="chart-placeholder">[Bar Chart Placeholder]</div>
                            </div>
                            <div>
                                <h4 className="bordered-section-title">Income by Payment Method</h4>
                                <div className="chart-placeholder">[Pie Chart Placeholder: Cash, GCash, Bank]</div>
                            </div>
                        </div>

                        <h3 className="page-section-subtitle" style={{ marginTop: '20px' }}>Summary</h3>
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Room Charges Summary</td>
                                    <td>₱0.00</td>
                                </tr>
                                <tr>
                                    <td>Additional Services Income</td>
                                    <td>₱0.00</td>
                                </tr>
                                <tr>
                                    <td>Refunds / Deductions</td>
                                    <td>(₱0.00)</td>
                                </tr>
                                <tr>
                                    <td>Damages Collected</td>
                                    <td>₱0.00</td>
                                </tr>
                                <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-color)' }}>
                                    <td>Gross Revenue</td>
                                    <td>₱0.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <button className="button" style={{ marginTop: '25px' }}>Export Report (PDF/Excel)</button>
                </section>
            </main>
        </>
    );
}