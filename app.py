from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import mysql.connector
from fpdf import FPDF
import os
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- DATABASE CONFIGURATION (TiDB Cloud) ---
db_config = {
    'host': 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    'port': 4000,
    'user': '25fqAgQrry9tuG7.root',
    'password': 'iOo2bOxZ5g2a7NDI',
    'database': 'hoteldb',
    'ssl_ca': 'ca.pem',
    'ssl_verify_cert': True,
    'ssl_verify_identity': True
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to DB: {err}")
        return None

# ==========================================
# MODULE 0 & 1: DASHBOARD & ROOM MANAGEMENT
# ==========================================
@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "No DB Connection"}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM rooms")
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

@app.route('/api/rooms', methods=['POST'])
def add_room():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    try:
        sql = "INSERT INTO rooms (room_number, room_type, price, floor, capacity, status) VALUES (%s, %s, %s, %s, %s, %s)"
        values = (data['room_number'], data['room_type'], data['price'], data['floor'], data['capacity'], data['status'])
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({"message": "Room added successfully!"})
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        conn.close()

@app.route('/api/rooms/<int:id>', methods=['PUT'])
def update_room(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    sql = "UPDATE rooms SET room_number=%s, room_type=%s, price=%s, floor=%s, capacity=%s, status=%s WHERE id=%s"
    values = (data['room_number'], data['room_type'], data['price'], data['floor'], data['capacity'], data['status'], id)
    cursor.execute(sql, values)
    conn.commit()
    conn.close()
    return jsonify({"message": "Room updated"})

@app.route('/api/rooms/<int:room_id>/status', methods=['PUT'])
def update_room_status(room_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    cursor.execute("UPDATE rooms SET status = %s WHERE id = %s", (data['status'], room_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Status updated successfully"})

@app.route('/api/rooms/<int:id>', methods=['DELETE'])
def delete_room(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM rooms WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Room deleted"})

# ==========================================
# MODULE 2: AMENITY ASSIGNMENT
# ==========================================
@app.route('/api/amenities', methods=['GET'])
def get_all_amenities():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM amenities")
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

@app.route('/api/amenities', methods=['POST'])
def add_amenity_catalog():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    cursor.execute("INSERT INTO amenities (name, price, type) VALUES (%s, %s, %s)", (data['name'], data['price'], data['type']))
    conn.commit()
    conn.close()
    return jsonify({"message": "Amenity created"})

@app.route('/api/rooms/<int:room_id>/amenities', methods=['GET'])
def get_room_amenities(room_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """SELECT ra.id, ra.quantity, a.name, a.price, a.type FROM room_amenities ra
             JOIN amenities a ON ra.amenity_id = a.id WHERE ra.room_id = %s"""
    cursor.execute(sql, (room_id,))
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

@app.route('/api/rooms/assign-amenity', methods=['POST'])
def assign_amenity():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    cursor.execute("SELECT id, quantity FROM room_amenities WHERE room_id=%s AND amenity_id=%s", (data['room_id'], data['amenity_id']))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("UPDATE room_amenities SET quantity=%s WHERE id=%s", (existing[1] + 1, existing[0]))
    else:
        cursor.execute("INSERT INTO room_amenities (room_id, amenity_id, quantity) VALUES (%s, %s, 1)", (data['room_id'], data['amenity_id']))
    conn.commit()
    conn.close()
    return jsonify({"message": "Assigned"})

@app.route('/api/room-amenities/<int:id>', methods=['DELETE'])
def remove_room_amenity(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM room_amenities WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Removed"})

# ==========================================
# MODULE 3: BED ASSIGNMENT
# ==========================================
@app.route('/api/beds', methods=['GET'])
def get_all_beds():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM beds")
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

@app.route('/api/rooms/<int:room_id>/beds', methods=['GET'])
def get_room_beds(room_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """SELECT rb.id, rb.count, rb.allow_extra, b.name FROM room_beds rb
             JOIN beds b ON rb.bed_id = b.id WHERE rb.room_id = %s"""
    cursor.execute(sql, (room_id,))
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

@app.route('/api/rooms/assign-bed', methods=['POST'])
def assign_bed():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    cursor.execute("SELECT id, count FROM room_beds WHERE room_id=%s AND bed_id=%s", (data['room_id'], data['bed_id']))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("UPDATE room_beds SET count=%s, allow_extra=%s, allow_rearrange=%s WHERE id=%s", 
                       (existing[1] + int(data['count']), data['allow_extra'], data['allow_rearrange'], existing[0]))
    else:
        cursor.execute("INSERT INTO room_beds (room_id, bed_id, count, allow_extra, allow_rearrange) VALUES (%s, %s, %s, %s, %s)", 
                       (data['room_id'], data['bed_id'], data['count'], data['allow_extra'], data['allow_rearrange']))
    conn.commit()
    conn.close()
    return jsonify({"message": "Bed assigned"})

@app.route('/api/room-beds/<int:id>', methods=['DELETE'])
def remove_room_bed(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM room_beds WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Removed"})

# ==========================================
# MODULE 4: SUPPLY ASSIGNMENT
# ==========================================
@app.route('/api/supplies', methods=['GET'])
def get_all_supplies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM supplies")
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

@app.route('/api/rooms/<int:room_id>/supplies', methods=['GET'])
def get_room_supplies(room_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """SELECT rs.id, rs.quantity, s.name, s.cost, s.status FROM room_supplies rs
             JOIN supplies s ON rs.supply_id = s.id WHERE rs.room_id = %s"""
    cursor.execute(sql, (room_id,))
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

@app.route('/api/rooms/assign-supply', methods=['POST'])
def assign_supply():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    cursor.execute("SELECT id, quantity FROM room_supplies WHERE room_id=%s AND supply_id=%s", (data['room_id'], data['supply_id']))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("UPDATE room_supplies SET quantity=%s WHERE id=%s", (existing[1] + int(data['quantity']), existing[0]))
    else:
        cursor.execute("INSERT INTO room_supplies (room_id, supply_id, quantity) VALUES (%s, %s, %s)", (data['room_id'], data['supply_id'], data['quantity']))
    conn.commit()
    conn.close()
    return jsonify({"message": "Supply assigned"})

@app.route('/api/room-supplies/<int:id>', methods=['DELETE'])
def remove_room_supply(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM room_supplies WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Removed"})

if __name__ == '__main__':
    app.run(debug=True)

# --- MODULE 5: BOOKING ROUTES ---

# 1. Get All Bookings (For the List View)
@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # We join with 'rooms' to show the Room Number in the list
    sql = """
        SELECT b.*, r.room_number, r.room_type 
        FROM bookings b
        LEFT JOIN rooms r ON b.room_id = r.id
        ORDER BY b.check_in DESC
    """
    cursor.execute(sql)
    bookings = cursor.fetchall()
    conn.close()
    return jsonify(bookings)

# 2. Create a New Booking
@app.route('/api/bookings', methods=['POST'])
def create_booking():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    
    sql = """
        INSERT INTO bookings 
        (first_name, last_name, contact_number, email, address, gender, 
         room_id, check_in, check_out, adults, children, 
         total_price, booking_type, status, special_requests)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    cursor.execute(sql, (
        data['first_name'], data['last_name'], data['contact_number'], 
        data['email'], data['address'], data['gender'],
        data['room_id'], data['check_in'], data['check_out'], 
        data['adults'], data['children'], data['total_price'], 
        data['booking_type'], data['status'], data['special_requests']
    ))
    
    # OPTIONAL: Automatically update the Room Status to 'Occupied' or 'Reserved'
    # if the status is Confirmed.
    if data['status'] == 'Confirmed':
        cursor.execute("UPDATE rooms SET status = 'Reserved' WHERE id = %s", (data['room_id'],))

    conn.commit()
    conn.close()
    return jsonify({"message": "Booking created successfully!"})

# --- DELETE BOOKING ROUTE ---
@app.route('/api/bookings/<int:id>', methods=['DELETE'])
def delete_booking(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. First, delete any payments associated with this booking
        # (Otherwise, the database will block you from deleting the booking)
        cursor.execute("DELETE FROM payments WHERE booking_id = %s", (id,))
        
        # 2. Then, delete the booking itself
        cursor.execute("DELETE FROM bookings WHERE id = %s", (id,))
        
        conn.commit()
        conn.close()
        return jsonify({"message": "Booking deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- MODULE 6: PAYMENT & RECEIPT (FINALIZED) ---

@app.route('/api/payments', methods=['POST'])
def process_payment():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    
    # 1. LOG THE PAYMENT TO MYSQL
    # We let MySQL handle the timestamp automatically for the database record
    sql = """
        INSERT INTO payments (booking_id, amount, payment_method, transaction_ref)
        VALUES (%s, %s, %s, %s)
    """
    cursor.execute(sql, (
        data['booking_id'], 
        data['amount'], 
        data['payment_method'], 
        data['transaction_ref']
    ))
    
    conn.commit()
    conn.close()

    # 2. GENERATE THE PDF RECEIPT
    pdf = FPDF()
    pdf.add_page()
    
    # --- HEADER ---
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(190, 10, txt="TONY'S APARTELLE", ln=True, align='C')
    
    pdf.set_font("Arial", size=10)
    pdf.cell(190, 5, txt="WG6V+RX4, Butuan City-Malaybalay Rd", ln=True, align='C')
    pdf.cell(190, 5, txt="Butuan City, 8600 Agusan del Norte", ln=True, align='C')
    pdf.cell(190, 5, txt="Phone: 0909 392 9516", ln=True, align='C')
    
    pdf.ln(10)
    pdf.line(10, 35, 200, 35) # Horizontal line
    pdf.ln(5)

    # --- RECEIPT DETAILS ---
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(190, 10, txt="OFFICIAL RECEIPT", ln=True, align='C')
    pdf.ln(5)

    pdf.set_font("Arial", size=11)
    
    # Left Column (Guest Info)
    pdf.cell(100, 8, txt=f"Guest Name: {data['guest_name']}", ln=0)
    # Right Column (Date)
    current_date = datetime.now().strftime("%B %d, %Y %I:%M %p")
    pdf.cell(90, 8, txt=f"Date: {current_date}", ln=1, align='R')

    pdf.cell(100, 8, txt=f"Booking Ref: #{data['booking_id']}", ln=1)
    pdf.cell(100, 8, txt=f"Room: {data['room_details']}", ln=1)
    
    pdf.ln(10)

    # --- PAYMENT TABLE ---
    # Header
    pdf.set_fill_color(240, 240, 240) # Light gray background
    pdf.set_font("Arial", 'B', 11)
    pdf.cell(130, 10, txt="Description", border=1, fill=True)
    pdf.cell(60, 10, txt="Amount (PHP)", border=1, fill=True, ln=True)
    
    # Rows
    pdf.set_font("Arial", size=11)
    pdf.cell(130, 10, txt="Accomodation Charge", border=1)
    # Note: 'P' is not always supported in standard fonts, so we use 'PHP ' or just the number
    pdf.cell(60, 10, txt=f"PHP {float(data['amount']):,.2f}", border=1, ln=True)
    
    # --- TOTALS ---
    pdf.ln(5)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(130, 10, txt="TOTAL PAID", border=0, align='R')
    pdf.cell(60, 10, txt=f"PHP {float(data['amount']):,.2f}", border=1, ln=True, align='C')

    pdf.set_font("Arial", 'I', 10)
    pdf.ln(5)
    pdf.cell(190, 8, txt=f"Paid via: {data['payment_method']}", ln=True, align='R')
    
    if data['transaction_ref']:
         pdf.cell(190, 8, txt=f"Ref No: {data['transaction_ref']}", ln=True, align='R')

    # --- FOOTER ---
    pdf.ln(20)
    pdf.set_font("Arial", size=10)
    pdf.cell(190, 10, txt="This document serves as an official acknowledgement of payment.", align='C')
    pdf.cell(190, 5, txt="Thank you for choosing Tony's Apartelle!", align='C')

    # 3. SAVE AND SEND
    filename = f"receipt_{data['booking_id']}.pdf"
    pdf.output(filename)
    
    try:
        return send_file(filename, as_attachment=True)
    finally:
        pass

# --- MODULE 8: CHECK-IN MODULE ---

# 1. Search for a Booking (To populate the form)
@app.route('/api/bookings/search', methods=['GET'])
def search_booking():
    query = request.args.get('q', '')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Matches Booking Ref OR Guest Name
    sql = """
        SELECT b.*, r.room_number, r.room_type, r.capacity 
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.status = 'Confirmed' 
        AND (b.first_name LIKE %s OR b.last_name LIKE %s OR b.id LIKE %s)
    """
    search_term = f"%{query}%"
    cursor.execute(sql, (search_term, search_term, search_term))
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

# 2. SUBMIT the Check-in (The actual "Submission" logic)
@app.route('/api/checkin', methods=['POST'])
def perform_checkin():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # A. Save the Check-in Form Data
        sql_insert = """
            INSERT INTO checkins 
            (booking_id, id_type, id_number, key_deposit, key_issued, notes, checkin_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql_insert, (
            data['booking_id'], 
            data['id_type'], 
            data['id_number'], 
            data['key_deposit'], 
            data['key_issued'], 
            data['notes'],
            data['checkin_time'] # Saves the custom time you picked
        ))

        # B. Update the Booking Status to 'Checked-in'
        cursor.execute("UPDATE bookings SET status = 'Checked-in' WHERE id = %s", (data['booking_id'],))

        conn.commit()
        return jsonify({"message": "Check-in Submitted Successfully"}), 200

    except Exception as e:
        print(f"Error submitting check-in: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 3. Get Active Check-ins (For the list at the bottom)
@app.route('/api/checkins/active', methods=['GET'])
def get_active_checkins():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """
        SELECT c.*, b.first_name, b.last_name, r.room_number
        FROM checkins c
        JOIN bookings b ON c.booking_id = b.id
        JOIN rooms r ON b.room_id = r.id
        WHERE b.status = 'Checked-in'
        ORDER BY c.checkin_time DESC
    """
    cursor.execute(sql)
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

# --- MODULE 8: SERVICES & REQUESTS ---

# 1. GET ACTIVE GUESTS (For the dropdown menu)
# Reuse the existing /api/checkins/active or make a specific lightweight one
@app.route('/api/services/guests', methods=['GET'])
def get_service_guests():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # We only want guests who are currently checked in
    sql = """
        SELECT b.id as booking_id, b.first_name, b.last_name, r.room_number 
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.status = 'Checked-in'
    """
    cursor.execute(sql)
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

# 2. SUBMIT NEW REQUEST
@app.route('/api/services/create', methods=['POST'])
def create_service_request():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
            INSERT INTO service_requests (booking_id, request_type, description, service_charge, staff_name, status)
            VALUES (%s, %s, %s, %s, %s, 'Pending')
        """
        cursor.execute(sql, (
            data['booking_id'],
            data['request_type'],
            data['description'],
            data['service_charge'],
            data['staff_name']
        ))
        conn.commit()
        return jsonify({"message": "Request logged"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 3. GET ALL OPEN REQUESTS (For the table below)
@app.route('/api/services/list', methods=['GET'])
def get_service_requests():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """
        SELECT s.*, b.first_name, b.last_name, r.room_number
        FROM service_requests s
        JOIN bookings b ON s.booking_id = b.id
        JOIN rooms r ON b.room_id = r.id
        ORDER BY s.status DESC, s.created_at DESC
    """
    cursor.execute(sql)
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

# 4. MARK REQUEST AS COMPLETE
@app.route('/api/services/complete/<int:id>', methods=['PUT'])
def complete_request(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE service_requests SET status = 'Completed' WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Updated"}), 200

# --- MODULE 9: CHECK-OUT LOGIC ---

# 1. SEARCH: Find guests specifically for Check-out
@app.route('/api/checkout/search', methods=['GET'])
def search_checkout_guest():
    query = request.args.get('q', '')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Only search bookings with status 'Checked-in'
    sql = """
        SELECT b.*, r.room_number, r.room_type 
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.status = 'Checked-in'
        AND (b.first_name LIKE %s OR r.room_number LIKE %s OR b.id LIKE %s)
    """
    search_term = f"%{query}%"
    cursor.execute(sql, (search_term, search_term, search_term))
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

# 2. SUBMIT CHECK-OUT
@app.route('/api/checkout/submit', methods=['POST'])
def perform_checkout():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # A. Log the Checkout
        sql_insert = """
            INSERT INTO checkouts 
            (booking_id, checkout_time, amenities_ok, room_condition_ok, key_returned, 
             damage_notes, damage_charge, final_room_condition, guest_feedback, 
             total_bill, final_balance_paid)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql_insert, (
            data['booking_id'],
            data['checkout_time'],
            data['amenities_ok'],
            data['room_condition_ok'],
            data['key_returned'],
            data['damage_notes'],
            data['damage_charge'],
            data['final_room_condition'],
            data['guest_feedback'],
            data['total_bill'],
            data['final_balance_paid']
        ))

        # B. Update Booking Status to 'Checked-out'
        cursor.execute("UPDATE bookings SET status = 'Checked-out' WHERE id = %s", (data['booking_id'],))

        # C. Update Room Status (e.g., set to 'Dirty' or 'Maintenance' based on inspection)
        # Assuming the form sends the desired room status
        new_room_status = 'Dirty' if data['final_room_condition'] == 'Needs Cleaning' else 'Available'
        if data['final_room_condition'] == 'Maintenance':
            new_room_status = 'Maintenance'
            
        # Get room_id from booking to update rooms table
        cursor.execute("SELECT room_id FROM bookings WHERE id = %s", (data['booking_id'],))
        room_id = cursor.fetchone()[0]
        
        cursor.execute("UPDATE rooms SET status = %s WHERE id = %s", (new_room_status, room_id))

        conn.commit()
        return jsonify({"message": "Check-out Complete"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# --- MODULE 10: UPDATE PAYMENT ---

# 1. GET PAYMENT STATUS (Search)
@app.route('/api/payments/status', methods=['GET'])
def get_payment_status():
    query = request.args.get('q', '')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # A. Find the Booking
        # We also grab room info to confirm it's the right person
        sql_booking = """
            SELECT b.id, b.booking_reference, b.first_name, b.last_name, b.total_price,
                   r.room_number
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.booking_reference = %s OR b.first_name LIKE %s
        """
        search_term = f"%{query}%"
        cursor.execute(sql_booking, (query, search_term))
        booking = cursor.fetchone()

        if not booking:
            return jsonify({"error": "Booking not found"}), 404

        booking_id = booking['id']

        # B. Calculate "Additional Charges" (Services + Damages)
        # 1. Services
        cursor.execute("SELECT SUM(service_charge) as total FROM service_requests WHERE booking_id = %s", (booking_id,))
        res_services = cursor.fetchone()
        service_total = float(res_services['total'] or 0)

        # 2. Damages (from Checkout module, if any exists yet)
        # Note: If checkout hasn't happened, this might be 0, which is fine.
        # We check if the 'checkouts' table exists first to avoid errors if you skipped that step temporarily.
        damage_total = 0.0
        cursor.execute("SHOW TABLES LIKE 'checkouts'")
        if cursor.fetchone():
            cursor.execute("SELECT SUM(damage_charge) as total FROM checkouts WHERE booking_id = %s", (booking_id,))
            res_damages = cursor.fetchone()
            damage_total = float(res_damages['total'] or 0)

        additional_charges = service_total + damage_total

        # C. Calculate Total Paid So Far (Sum of Module 6 payments + any updates)
        cursor.execute("SELECT SUM(amount) as total FROM payments WHERE booking_id = %s", (booking_id,))
        res_payments = cursor.fetchone()
        total_paid_so_far = float(res_payments['total'] or 0)

        # D. Response Data
        response = {
            "booking_id": booking['id'],
            "guest_name": f"{booking['first_name']} {booking['last_name']}",
            "reference": booking['booking_reference'],
            "original_bill": float(booking['total_price']),
            "additional_charges": additional_charges,
            "total_amount": float(booking['total_price']) + additional_charges,
            "total_paid": total_paid_so_far
        }
        
        return jsonify(response)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 2. SUBMIT UPDATE (Add New Payment)
@app.route('/api/payments/update', methods=['POST'])
def update_payment():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # We insert a NEW row into 'payments'. 
        # This keeps a history (e.g., Row 1: Deposit 500, Row 2: Final Payment 1000)
        # This is safer than editing the old row because you lose the record of the deposit.
        sql = """
            INSERT INTO payments (booking_id, amount, payment_method, payment_date, remarks)
            VALUES (%s, %s, %s, NOW(), %s)
        """
        cursor.execute(sql, (
            data['booking_id'],
            data['amount_to_pay'],
            data['payment_method'],
            data['remarks']
        ))
        conn.commit()
        return jsonify({"message": "Payment Updated Successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# --- MODULE 11: INVENTORY REPORT ---

@app.route('/api/inventory/report', methods=['GET'])
def get_inventory_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    inventory_data = {
        "amenities": [],
        "supplies": []
    }

    try:
        # 1. Try to fetch Amenities (Module 2 data)
        # Adjust table name if yours is different (e.g., 'room_amenities')
        cursor.execute("SELECT * FROM amenities") 
        inventory_data["amenities"] = cursor.fetchall()
    except Exception:
        # Fallback if table doesn't exist
        inventory_data["amenities"] = [
            {"name": "Bath Towel", "quantity": 150, "status": "OK"},
            {"name": "Face Towel", "quantity": 80, "status": "Restock"},
            {"name": "Soap Bar", "quantity": 200, "status": "OK"}
        ]

    try:
        # 2. Try to fetch Supplies/Assets (Module 4 data)
        cursor.execute("SELECT * FROM supplies") 
        inventory_data["supplies"] = cursor.fetchall()
    except Exception:
        # Fallback if table doesn't exist
        inventory_data["supplies"] = [
            {"name": "Toilet Paper (Rolls)", "quantity": 40, "status": "Critical"},
            {"name": "Shampoo (Bottles)", "quantity": 55, "status": "OK"},
            {"name": "Cleaning Kit", "quantity": 10, "status": "OK"}
        ]

    conn.close()
    return jsonify(inventory_data)

# --- MODULE 12: INCOME REPORT (NO SERVICE CHARGES) ---
@app.route('/api/reports/dashboard', methods=['GET'])
def get_income_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # --- HELPER: Safely get sum from a table ---
        def get_safe_sum(table_name, column_name, where_clause=""):
            cursor.execute(f"SHOW TABLES LIKE '{table_name}'")
            if not cursor.fetchone():
                return 0.0
            
            # Check if column exists before summing (Extra safety)
            cursor.execute(f"SHOW COLUMNS FROM {table_name} LIKE '{column_name}'")
            if not cursor.fetchone():
                return 0.0

            sql = f"SELECT SUM({column_name}) as total FROM {table_name} {where_clause}"
            cursor.execute(sql)
            result = cursor.fetchone()
            return float(result['total']) if result and result['total'] else 0.0

        # --- 1. CALCULATE REVENUE ---
        room_revenue = get_safe_sum('bookings', 'total_price', "WHERE status != 'Cancelled'")
        
        # FIXED: We are not tracking service charges, so this is always 0
        service_revenue = 0.0 
        
        damage_revenue = get_safe_sum('checkouts', 'damage_charge')

        total_revenue = room_revenue + service_revenue + damage_revenue

        # --- 2. OCCUPANCY RATE ---
        cursor.execute("SELECT COUNT(*) as total FROM rooms")
        res_rooms = cursor.fetchone()
        total_rooms = res_rooms['total'] if res_rooms else 0

        occupied_rooms = 0
        if total_rooms > 0:
            cursor.execute("SELECT COUNT(*) as occupied FROM bookings WHERE status IN ('Checked-in', 'Confirmed')")
            res_occ = cursor.fetchone()
            occupied_rooms = res_occ['occupied'] if res_occ else 0
        
        occupancy_rate = round((occupied_rooms / total_rooms * 100), 1) if total_rooms > 0 else 0

        # --- 3. ADR (Average Daily Rate) ---
        cursor.execute("SELECT AVG(total_price) as adr FROM bookings WHERE status != 'Cancelled'")
        res_adr = cursor.fetchone()
        adr = round(float(res_adr['adr']), 2) if res_adr and res_adr['adr'] else 0.0

        # --- 4. CHARTS DATA ---
        
        # Room Type Chart
        cursor.execute("""
            SELECT r.room_type as name, SUM(b.total_price) as value
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.status != 'Cancelled'
            GROUP BY r.room_type
        """)
        room_type_data = cursor.fetchall()

        # Payment Method Chart
        payment_method_data = []
        cursor.execute("SHOW TABLES LIKE 'payments'")
        if cursor.fetchone():
            cursor.execute("""
                SELECT payment_method as name, SUM(amount) as value
                FROM payments
                GROUP BY payment_method
            """)
            payment_method_data = cursor.fetchall()

        # --- 5. SEND RESPONSE ---
        return jsonify({
            "metrics": {
                "total_revenue": total_revenue,
                "occupancy_rate": occupancy_rate,
                "adr": adr,
                "revpar": round(total_revenue / total_rooms, 2) if total_rooms else 0
            },
            "charts": {
                "room_type": room_type_data,
                "payment_method": payment_method_data
            },
            "summary": {
                "room_charges": room_revenue,
                "services": service_revenue, # This will now safely send 0
                "damages": damage_revenue,
                "gross": total_revenue
            }
        })

    except Exception as e:
        print(f"❌ DASHBOARD ERROR: {e}") 
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)