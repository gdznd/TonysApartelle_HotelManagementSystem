from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import mysql.connector
from fpdf import FPDF
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})

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

# if __name__ == '__main__':
#     app.run(debug=True)

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
        (booking_reference, first_name, last_name, contact_number, email, address, gender, 
        room_id, check_in, check_out, adults, children, 
        total_price, booking_type, status, special_requests)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        data['booking_reference'],
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
# --- DELETE BOOKING ROUTE ---
@app.route('/api/bookings/<int:id>', methods=['DELETE'])
def delete_booking(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM payments WHERE booking_id = %s", (id,))
        cursor.execute("DELETE FROM bookings WHERE id = %s", (id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Booking deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- UPDATE BOOKING ROUTE --- ← NEW
@app.route('/api/bookings/<int:id>', methods=['PUT'])
def update_booking(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        data = request.json
        sql = """
            UPDATE bookings SET
                first_name=%s, last_name=%s, contact_number=%s, email=%s,
                address=%s, gender=%s, room_id=%s, check_in=%s, check_out=%s,
                adults=%s, children=%s, total_price=%s, booking_type=%s,
                status=%s, special_requests=%s
            WHERE id=%s
        """
        cursor.execute(sql, (
            data['first_name'], data['last_name'], data['contact_number'],
            data['email'], data['address'], data['gender'],
            data['room_id'], data['check_in'], data['check_out'],
            data['adults'], data['children'], data['total_price'],
            data['booking_type'], data['status'], data['special_requests'],
            id
        ))
        conn.commit()
        conn.close()
        return jsonify({"message": "Booking updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# # --- MODULE 6: PAYMENT & RECEIPT (FINALIZED) ---

# @app.route('/api/payments', methods=['POST'])
# def process_payment():
#     conn = get_db_connection()
#     cursor = conn.cursor()
#     data = request.json
    
#     # 1. LOG THE PAYMENT TO MYSQL
#     # We let MySQL handle the timestamp automatically for the database record
#     sql = """
#         INSERT INTO payments (booking_id, amount, payment_method, transaction_ref)
#         VALUES (%s, %s, %s, %s)
#     """
#     cursor.execute(sql, (
#         data['booking_id'], 
#         data['amount'], 
#         data['payment_method'], 
#         data['transaction_ref']
#     ))
    
#     conn.commit()
#     conn.close()

#     # 2. GENERATE THE PDF RECEIPT
#     pdf = FPDF()
#     pdf.add_page()
    
#     # --- HEADER ---
#     pdf.set_font("Arial", 'B', 16)
#     pdf.cell(190, 10, txt="TONY'S APARTELLE", ln=True, align='C')
    
#     pdf.set_font("Arial", size=10)
#     pdf.cell(190, 5, txt="WG6V+RX4, Butuan City-Malaybalay Rd", ln=True, align='C')
#     pdf.cell(190, 5, txt="Butuan City, 8600 Agusan del Norte", ln=True, align='C')
#     pdf.cell(190, 5, txt="Phone: 0909 392 9516", ln=True, align='C')
    
#     pdf.ln(10)
#     pdf.line(10, 35, 200, 35) # Horizontal line
#     pdf.ln(5)

#     # --- RECEIPT DETAILS ---
#     pdf.set_font("Arial", 'B', 12)
#     pdf.cell(190, 10, txt="OFFICIAL RECEIPT", ln=True, align='C')
#     pdf.ln(5)

#     pdf.set_font("Arial", size=11)
    
#     # Left Column (Guest Info)
#     pdf.cell(100, 8, txt=f"Guest Name: {data['guest_name']}", ln=0)
#     # Right Column (Date)
#     current_date = datetime.now().strftime("%B %d, %Y %I:%M %p")
#     pdf.cell(90, 8, txt=f"Date: {current_date}", ln=1, align='R')

#     pdf.cell(100, 8, txt=f"Booking Ref: #{data['booking_id']}", ln=1)
#     pdf.cell(100, 8, txt=f"Room: {data['room_details']}", ln=1)
    
#     pdf.ln(10)

#     # --- PAYMENT TABLE ---
#     # Header
#     pdf.set_fill_color(240, 240, 240) # Light gray background
#     pdf.set_font("Arial", 'B', 11)
#     pdf.cell(130, 10, txt="Description", border=1, fill=True)
#     pdf.cell(60, 10, txt="Amount (PHP)", border=1, fill=True, ln=True)
    
#     # Rows
#     pdf.set_font("Arial", size=11)
#     pdf.cell(130, 10, txt="Accomodation Charge", border=1)
#     # Note: 'P' is not always supported in standard fonts, so we use 'PHP ' or just the number
#     pdf.cell(60, 10, txt=f"PHP {float(data['amount']):,.2f}", border=1, ln=True)
    
#     # --- TOTALS ---
#     pdf.ln(5)
#     pdf.set_font("Arial", 'B', 12)
#     pdf.cell(130, 10, txt="TOTAL PAID", border=0, align='R')
#     pdf.cell(60, 10, txt=f"PHP {float(data['amount']):,.2f}", border=1, ln=True, align='C')

#     pdf.set_font("Arial", 'I', 10)
#     pdf.ln(5)
#     pdf.cell(190, 8, txt=f"Paid via: {data['payment_method']}", ln=True, align='R')
    
#     if data['transaction_ref']:
#          pdf.cell(190, 8, txt=f"Ref No: {data['transaction_ref']}", ln=True, align='R')

#     # --- FOOTER ---
#     pdf.ln(20)
#     pdf.set_font("Arial", size=10)
#     pdf.cell(190, 10, txt="This document serves as an official acknowledgement of payment.", align='C')
#     pdf.cell(190, 5, txt="Thank you for choosing Tony's Apartelle!", align='C')

#     # 3. SAVE AND SEND
#     filename = f"receipt_{data['booking_id']}.pdf"
#     pdf.output(filename)
    
#     try:
#         return send_file(filename, as_attachment=True)
#     finally:
#         pass

# ===========================================================
# MODULE 6 — Payment & Receipt
# ===========================================================

@app.route('/api/bookings/ref/<search_term>', methods=['GET'])
def get_booking(search_term):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Wrap the search term in wildcards for flexible matching
        like_term = f"%{search_term}%"

        cursor.execute("""
            SELECT
                b.id,
                b.booking_reference,
                CONCAT(b.first_name, ' ', b.last_name)         AS guest_name,
                CONCAT(r.room_type, ' - Room ', r.room_number) AS room_type,
                b.total_price                                   AS total_amount,
                COALESCE(SUM(p.amount_paid), 0)                AS amount_paid,
                b.total_price - COALESCE(SUM(p.amount_paid), 0) AS balance
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN payments p ON p.booking_id = b.id
            WHERE b.booking_reference LIKE %s
               OR b.first_name LIKE %s
               OR b.last_name LIKE %s
               OR CONCAT(b.first_name, ' ', b.last_name) LIKE %s
               OR b.check_in LIKE %s
            GROUP BY b.id, b.booking_reference, b.first_name, b.last_name,
                     r.room_type, r.room_number, b.total_price
            ORDER BY b.id DESC
        """, (like_term, like_term, like_term, like_term, like_term))
        
        bookings = cursor.fetchall()
        
        if not bookings:
            return jsonify([]), 200 # Return empty array if no match
            
        return jsonify(bookings), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/payments', methods=['POST'])
def log_payment():
    data = request.get_json()
    booking_id     = data.get('booking_id')
    receipt_number = data.get('receipt_number')
    payment_method = data.get('payment_method')
    amount_paid    = float(data.get('amount_paid', 0))
    cash_received  = float(data.get('cash_received', 0))

    if not booking_id or amount_paid <= 0:
        return jsonify({"message": "Invalid payment data"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Get booking using booking_reference, fetch integer PK and total_price
        cursor.execute("SELECT id, total_price FROM bookings WHERE booking_reference = %s", (booking_id,))
        booking = cursor.fetchone()
        if not booking:
            return jsonify({"message": "Booking not found"}), 404

        db_booking_id = booking['id']
        total_amount  = float(booking['total_price'])

        # 2. Get sum of previous payments using integer PK
        cursor.execute(
            "SELECT COALESCE(SUM(amount_paid), 0) AS paid FROM payments WHERE booking_id = %s",
            (db_booking_id,)
        )
        previous_paid  = float(cursor.fetchone()['paid'])
        new_total_paid = previous_paid + amount_paid
        new_balance    = total_amount - new_total_paid

        # 3. Determine status
        if new_balance <= 0:
            status = 'Fully Paid'
        elif new_total_paid > 0:
            status = 'Partially Paid'
        else:
            status = 'Unpaid'

        # 4. Insert payment row using integer PK
        cursor.execute("""
            INSERT INTO payments
                (booking_id, receipt_number, payment_method, amount_paid,
                 cash_received, balance, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (db_booking_id, receipt_number, payment_method, amount_paid,
              cash_received, max(new_balance, 0), status))

        conn.commit()
        return jsonify({
            "message":         "Payment logged",
            "new_amount_paid": new_total_paid,
            "new_balance":     max(new_balance, 0),
            "status":          status
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

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
        WHERE b.status IN ('Confirmed', 'Checked-In')
        AND (b.first_name LIKE %s OR b.last_name LIKE %s 
             OR b.booking_reference LIKE %s OR CONCAT(b.first_name, ' ', b.last_name) LIKE %s)
    """
    search_term = f"%{query}%"
    cursor.execute(sql, (search_term, search_term, search_term, search_term))
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
        SELECT c.id AS checkin_id, b.id AS booking_id, b.booking_reference,
                   CONCAT(b.first_name, ' ', b.last_name) AS guest_name,
                   r.room_number, c.checkin_time
            FROM checkins c
            JOIN bookings b ON c.booking_id = b.id
            JOIN rooms r ON b.room_id = r.id
            WHERE c.status = 'Active'
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

# ===========================================================
# MODULE 11 — Payment Update
# ===========================================================

@app.route('/api/payments', methods=['GET'])
def get_all_payments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                MAX(p.id)                                           AS id,
                b.booking_reference                                 AS booking_id,
                CONCAT(b.first_name, ' ', b.last_name)             AS guest_name,
                r.room_number                                       AS room_id,
                b.total_price                                       AS total_amount,
                COALESCE(SUM(p.amount_paid), 0)                    AS amount_paid,
                b.total_price - COALESCE(SUM(p.amount_paid), 0)    AS balance,
                CASE
                    WHEN b.total_price - COALESCE(SUM(p.amount_paid), 0) <= 0 THEN 'Fully Paid'
                    WHEN COALESCE(SUM(p.amount_paid), 0) > 0 THEN 'Partially Paid'
                    ELSE 'Unpaid'
                END                                                 AS status
            FROM bookings b
            LEFT JOIN payments p ON p.booking_id = b.id
            JOIN rooms r ON b.room_id = r.id
            GROUP BY b.id, b.booking_reference, b.first_name, b.last_name, r.room_number, b.total_price
            ORDER BY MAX(p.id) DESC
        """)
        payments = cursor.fetchall()
        return jsonify(payments), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/payments/update', methods=['PUT'])
def update_payment():
    """
    Called when staff clicks 'Save Update' in Module 11.
    Updates amount_paid, balance, and status for a payment record.

    Expected request body:
    {
      "id": 1,
      "amount_paid": 5000.00,
      "balance": 1180.00,
      "status": "Partially Paid"
    }
    """
    data = request.get_json()
    payment_id  = data.get('id')
    amount_paid = data.get('amount_paid')
    balance     = data.get('balance')
    status      = data.get('status')

    if payment_id is None or amount_paid is None:
        return jsonify({"message": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE payments
            SET amount_paid = %s,
                balance     = %s,
                status      = %s
            WHERE id = %s
        """, (amount_paid, balance, status, payment_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Payment record not found"}), 404

        return jsonify({"message": "Payment updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===========================================================
# MODULE 13 — Income Report Dashboard
# ===========================================================

@app.route('/api/reports/income', methods=['GET'])
def get_income_report():
    """
    Called by Module 13 on load and on every 'Filter Report' click.
    Accepts optional query params: start_date, end_date, filter_by

    Example: /api/reports/income?start_date=2026-01-01&end_date=2026-03-31&filter_by=Monthly

    Expected response shape:
    {
      "total_revenue": 45000.00,
      "occupancy_rate": 72.5,
      "adr": 2250.00,
      "revpar": 1631.25,
      "room_charges": 40000.00,
      "services_income": 5000.00,
      "refunds": 500.00,
      "damages_collected": 200.00,
      "income_by_room_type": [
          {"room_type": "Standard", "total": 15000},
          {"room_type": "Deluxe",   "total": 25000},
          {"room_type": "Suite",    "total": 5000}
      ],
      "income_by_payment_method": [
          {"payment_method": "Cash",     "total": 20000},
          {"payment_method": "GCash",    "total": 15000},
          {"payment_method": "Bank Transfer", "total": 10000}
      ]
    }
    """
    start_date = request.args.get('start_date')  # e.g. "2026-01-01"
    end_date   = request.args.get('end_date')    # e.g. "2026-03-31"
    # filter_by is used for future grouping logic (Daily/Weekly/Monthly)
    # filter_by = request.args.get('filter_by', 'Monthly')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Build optional date filter clause
        date_filter = ""
        params = []
        if start_date and end_date:
            date_filter = "WHERE p.created_at BETWEEN %s AND %s"
            params = [start_date, end_date + ' 23:59:59']
        elif start_date:
            date_filter = "WHERE p.created_at >= %s"
            params = [start_date]
        elif end_date:
            date_filter = "WHERE p.created_at <= %s"
            params = [end_date + ' 23:59:59']

        # --- 1. TOTAL REVENUE (sum of all amount_paid in range) ---
        cursor.execute(f"""
            SELECT COALESCE(SUM(p.amount_paid), 0) AS total_revenue
            FROM payments p {date_filter}
        """, params)
        total_revenue = float(cursor.fetchone()['total_revenue'])

        # --- 2. ROOM CHARGES (payments linked to room bookings only) ---
        # Adjust category filter to match your data. If you don't have categories,
        # just use total_revenue for room_charges.
        cursor.execute(f"""
            SELECT COALESCE(SUM(p.amount_paid), 0) AS room_charges
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            {date_filter}
        """, params)
        room_charges = float(cursor.fetchone()['room_charges'])

        # --- 3. SERVICES INCOME ---
        # If you have a separate guest_requests/services table, query it here.
        # For now, defaults to 0. Replace with real query when Module 9 is ready.
        services_income = 0.00

        # --- 4. REFUNDS (negative payments or a refunds column) ---
        # If you track refunds as negative amount_paid or a separate table, query here.
        refunds = 0.00

        # --- 5. DAMAGES COLLECTED ---
        damages_collected = 0.00

        # --- 6. OCCUPANCY RATE ---
        # occupied rooms / total rooms * 100
        cursor.execute("SELECT COUNT(*) AS total FROM rooms")
        total_rooms = cursor.fetchone()['total'] or 1

        cursor.execute("""
            SELECT COUNT(DISTINCT room_id) AS occupied
            FROM bookings
            WHERE status IN ('checked_in', 'Checked In')
        """)
        occupied_rooms = cursor.fetchone()['occupied']
        occupancy_rate = (occupied_rooms / total_rooms) * 100

        # --- 7. ADR (Average Daily Rate) = total revenue / number of bookings ---
        cursor.execute(f"""
            SELECT COUNT(DISTINCT p.booking_id) AS booking_count
            FROM payments p {date_filter}
        """, params)
        booking_count = cursor.fetchone()['booking_count'] or 1
        adr = total_revenue / booking_count

        # --- 8. RevPAR = ADR * occupancy_rate / 100 ---
        revpar = adr * (occupancy_rate / 100)

        # --- 9. INCOME BY ROOM TYPE ---
        cursor.execute(f"""
            SELECT
                r.room_type,
                COALESCE(SUM(p.amount_paid), 0) AS total
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            JOIN rooms r ON b.room_id = r.id
            {date_filter}
            GROUP BY r.room_type
            ORDER BY total DESC
        """, params)
        income_by_room_type = cursor.fetchall()

        # --- 10. INCOME BY PAYMENT METHOD ---
        cursor.execute(f"""
            SELECT
                p.payment_method,
                COALESCE(SUM(p.amount_paid), 0) AS total
            FROM payments p {date_filter}
            GROUP BY p.payment_method
            ORDER BY total DESC
        """, params)
        income_by_payment_method = cursor.fetchall()

        return jsonify({
            "total_revenue":             total_revenue,
            "occupancy_rate":            round(occupancy_rate, 2),
            "adr":                       round(adr, 2),
            "revpar":                    round(revpar, 2),
            "room_charges":              room_charges,
            "services_income":           services_income,
            "refunds":                   refunds,
            "damages_collected":         damages_collected,
            "income_by_room_type":       income_by_room_type,
            "income_by_payment_method":  income_by_payment_method,
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(debug=False, port=5000)