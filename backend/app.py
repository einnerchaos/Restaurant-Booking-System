from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
# from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta

app = Flask(__name__, instance_path='/tmp')
app.config['SECRET_KEY'] = 'restaurant-booking-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///restaurant_booking.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['JWT_SECRET_KEY'] = 'jwt-secret-key-restaurant'
# app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db = SQLAlchemy(app)
# jwt = JWTManager(app)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Create upload folder (same as reference project)
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(db.String(20), default='customer')  # customer, restaurant_admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Restaurant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(500), nullable=False)
    cuisine = db.Column(db.String(100))
    description = db.Column(db.Text)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    opening_hours = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Table(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'))
    table_number = db.Column(db.String(20), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='available')  # available, occupied, reserved

class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    table_id = db.Column(db.Integer, db.ForeignKey('table.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'))
    reservation_date = db.Column(db.Date, nullable=False)
    reservation_time = db.Column(db.String(10), nullable=False)  # HH:MM format
    guests = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='confirmed')  # confirmed, cancelled, completed
    special_requests = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'))
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    is_available = db.Column(db.Boolean, default=True)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reservation_id = db.Column(db.Integer, db.ForeignKey('reservation.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'))
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, preparing, ready, served
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'))
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'))
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

# Authentication routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password, data['password']):
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        })
    return jsonify({'error': 'Invalid credentials'}), 401

# Restaurant routes
@app.route('/api/restaurants', methods=['GET'])
def get_restaurants():
    restaurants = Restaurant.query.all()
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'address': r.address,
        'cuisine': r.cuisine,
        'description': r.description,
        'phone': r.phone,
        'email': r.email,
        'opening_hours': r.opening_hours
    } for r in restaurants])

@app.route('/api/restaurants/<int:restaurant_id>', methods=['GET'])
def get_restaurant(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    return jsonify({
        'id': restaurant.id,
        'name': restaurant.name,
        'address': restaurant.address,
        'cuisine': restaurant.cuisine,
        'description': restaurant.description,
        'phone': restaurant.phone,
        'email': restaurant.email,
        'opening_hours': restaurant.opening_hours
    })

# Table routes
@app.route('/api/restaurants/<int:restaurant_id>/tables', methods=['GET'])
def get_restaurant_tables(restaurant_id):
    tables = Table.query.filter_by(restaurant_id=restaurant_id).all()
    return jsonify([{
        'id': t.id,
        'table_number': t.table_number,
        'capacity': t.capacity,
        'status': t.status
    } for t in tables])

# Reservation routes
@app.route('/api/reservations', methods=['GET'])
def get_reservations():
    # For demo: return all reservations
    reservations = Reservation.query.all()
    return jsonify([{
        'id': r.id,
        'table_id': r.table_id,
        'user_id': r.user_id,
        'restaurant_id': r.restaurant_id,
        'reservation_date': r.reservation_date.isoformat(),
        'reservation_time': r.reservation_time,
        'guests': r.guests,
        'status': r.status,
        'special_requests': r.special_requests,
        'created_at': r.created_at.isoformat()
    } for r in reservations])

@app.route('/api/reservations', methods=['POST'])
def create_reservation():
    data = request.get_json()
    # For demo: use first user as the reservation owner
    user = User.query.first()
    if not user:
        return jsonify({'error': 'No user found'}), 400
    existing_reservation = Reservation.query.filter_by(
        table_id=data['table_id'],
        reservation_date=datetime.strptime(data['reservation_date'], '%Y-%m-%d').date(),
        reservation_time=data['reservation_time']
    ).first()
    if existing_reservation:
        return jsonify({'error': 'Table is already reserved for this time'}), 400
    reservation = Reservation(
        table_id=data['table_id'],
        user_id=user.id,
        restaurant_id=data['restaurant_id'],
        reservation_date=datetime.strptime(data['reservation_date'], '%Y-%m-%d').date(),
        reservation_time=data['reservation_time'],
        guests=data['guests'],
        special_requests=data.get('special_requests', '')
    )
    db.session.add(reservation)
    db.session.commit()
    socketio.emit('new_reservation', {
        'reservation_id': reservation.id,
        'restaurant_id': reservation.restaurant_id,
        'user_name': user.name,
        'guests': reservation.guests,
        'time': reservation.reservation_time,
        'date': reservation.reservation_date.isoformat()
    }, room=f'restaurant_{reservation.restaurant_id}')
    return jsonify({'message': 'Reservation created successfully', 'id': reservation.id}), 201

@app.route('/api/reservations/<int:reservation_id>', methods=['PUT'])
def update_reservation(reservation_id):
    reservation = Reservation.query.get_or_404(reservation_id)
    data = request.get_json()
    
    if 'status' in data:
        reservation.status = data['status']
    
    if 'special_requests' in data:
        reservation.special_requests = data['special_requests']
    
    db.session.commit()
    
    return jsonify({'message': 'Reservation updated successfully'})

# Menu routes
@app.route('/api/restaurants/<int:restaurant_id>/menu', methods=['GET'])
def get_restaurant_menu(restaurant_id):
    menu_items = MenuItem.query.filter_by(restaurant_id=restaurant_id, is_available=True).all()
    return jsonify([{
        'id': item.id,
        'name': item.name,
        'description': item.description,
        'price': item.price,
        'category': item.category
    } for item in menu_items])

# Order routes
@app.route('/api/orders', methods=['GET'])
def get_orders():
    orders = Order.query.all()
    return jsonify([{
        'id': o.id,
        'reservation_id': o.reservation_id,
        'user_id': o.user_id,
        'restaurant_id': o.restaurant_id,
        'total': o.total,
        'status': o.status,
        'created_at': o.created_at.isoformat()
    } for o in orders])

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    
    order = Order(
        reservation_id=data['reservation_id'],
        user_id=data['user_id'], # Use provided user_id for demo
        restaurant_id=data['restaurant_id'],
        total=data['total'],
        status='pending'
    )
    
    db.session.add(order)
    db.session.commit()
    
    # Add order items
    for item in data['items']:
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=item['menu_item_id'],
            quantity=item['quantity'],
            price=item['price']
        )
        db.session.add(order_item)
    
    db.session.commit()
    
    # Emit real-time notification to kitchen
    socketio.emit('new_order', {
        'order_id': order.id,
        'restaurant_id': order.restaurant_id,
        'items': data['items'],
        'total': order.total
    }, room=f'kitchen_{order.restaurant_id}')
    
    return jsonify({'message': 'Order created successfully', 'order_id': order.id}), 201

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    order.status = data['status']
    db.session.commit()
    
    # Emit real-time notification to customer
    socketio.emit('order_status_updated', {
        'order_id': order.id,
        'status': order.status
    }, room=f'user_{order.user_id}')
    
    return jsonify({'message': 'Order status updated successfully'})

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_restaurant')
def handle_join_restaurant(data):
    restaurant_id = data['restaurant_id']
    join_room(f'restaurant_{restaurant_id}')
    print(f'Client joined restaurant room: {restaurant_id}')

@socketio.on('join_kitchen')
def handle_join_kitchen(data):
    restaurant_id = data['restaurant_id']
    join_room(f'kitchen_{restaurant_id}')
    print(f'Client joined kitchen room: {restaurant_id}')

@socketio.on('join_user')
def handle_join_user(data):
    user_id = data['user_id']
    join_room(f'user_{user_id}')
    print(f'Client joined user room: {user_id}')

# Global flag to track initialization
_initialized = False

def initialize_database():
    with app.app_context():
        db.create_all()
        
        # Create admin user if not exists
        if not User.query.filter_by(email='admin@restaurant.com').first():
            admin = User(
                email='admin@restaurant.com',
                password=generate_password_hash('admin123'),
                name='Restaurant Admin',
                role='restaurant_admin'
            )
            db.session.add(admin)
            # Create sample restaurants
            restaurants = [
                Restaurant(
                    name='Fine Dining Restaurant',
                    address='123 Main Street, City Center, Berlin',
                    cuisine='International',
                    description='A premium dining experience with world-class cuisine',
                    phone='+49-30-123456',
                    email='info@finedining.com',
                    opening_hours='11:00 AM - 11:00 PM',
                ),
                Restaurant(
                    name='Kebab Haus',
                    address='Karl-Marx-Str. 45, Neukölln, Berlin',
                    cuisine='Turkish',
                    description='Authentic döner and Turkish grill specialties',
                    phone='+49-30-987654',
                    email='info@kebabhaus.de',
                    opening_hours='10:00 AM - 2:00 AM',
                ),
                Restaurant(
                    name='Pizza Napoli',
                    address='Ludwigstr. 12, Altstadt, Munich',
                    cuisine='Italian',
                    description='Wood-fired pizzas and classic Italian dishes',
                    phone='+49-89-555555',
                    email='info@pizzanapoli.de',
                    opening_hours='12:00 PM - 12:00 AM',
                ),
                Restaurant(
                    name='Sushi Meister',
                    address='Königsallee 99, Stadtmitte, Düsseldorf',
                    cuisine='Japanese',
                    description='Fresh sushi and Japanese cuisine in the heart of Düsseldorf',
                    phone='+49-211-333333',
                    email='info@sushimeister.de',
                    opening_hours='11:30 AM - 10:30 PM',
                ),
                Restaurant(
                    name='Bavarian Bräuhaus',
                    address='Marienplatz 1, Innenstadt, Munich',
                    cuisine='German',
                    description='Traditional Bavarian food and beer garden',
                    phone='+49-89-777777',
                    email='info@brauhaus.de',
                    opening_hours='10:00 AM - 1:00 AM',
                ),
            ]
            for r in restaurants:
                db.session.add(r)
            db.session.commit()
            # Add tables for each restaurant
            for r in Restaurant.query.all():
                tables = [
                    Table(restaurant_id=r.id, table_number='1', capacity=2, status='available'),
                    Table(restaurant_id=r.id, table_number='2', capacity=4, status='reserved'),
                    Table(restaurant_id=r.id, table_number='3', capacity=6, status='available'),
                    Table(restaurant_id=r.id, table_number='4', capacity=2, status='occupied'),
                    Table(restaurant_id=r.id, table_number='5', capacity=8, status='available'),
                ]
                for t in tables:
                    db.session.add(t)
            db.session.commit()
            # Add menu items for each restaurant (optional, not shown in UI)
            # ...

        # Create demo customer user if not exists
        if not User.query.filter_by(email='customer@example.com').first():
            customer = User(
                email='customer@example.com',
                password=generate_password_hash('customer123'),
                name='Demo Customer',
                role='customer'
            )
            db.session.add(customer)
            db.session.commit()

@app.before_request
def ensure_initialized():
    global _initialized
    if not _initialized:
        with app.app_context():
            initialize_database()
        _initialized = True

if __name__ == '__main__':
    initialize_database()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True) 