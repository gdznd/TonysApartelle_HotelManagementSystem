import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Inventory() {
  // 1. STATE: This is where we store the list of items
  const [items, setItems] = useState([]);

  // 2. EFFECT: When the page loads, go fetch the data
  useEffect(() => {
    // We use axios to call your Python Backend
    axios.get('http://127.0.0.1:5000/api/inventory')
      .then(response => {
        console.log("Data received:", response.data); // check console if stuck
        setItems(response.data);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  }, []);

  // 3. RENDER: Draw the table
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>📦 Inventory List</h2>
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#ddd' }}>
            <th>Item Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.item_name}</td>
              <td>{item.category}</td>
              <td>{item.quantity}</td>
              <td>{item.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}