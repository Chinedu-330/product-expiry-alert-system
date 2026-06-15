from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    full_name = db.Column(db.String(100), nullable=False)

    email = db.Column(db.String(120), unique=True, nullable=False)

    company = db.Column(db.String(100))

    password = db.Column(db.String(255), nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())


class Product(db.Model):

    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)

    product_name = db.Column(db.String(150), nullable=False)

    category = db.Column(db.String(50))

    quantity = db.Column(db.Integer)

    batch_number = db.Column(db.String(100))

    expiry_date = db.Column(db.Date)

    alert_threshold = db.Column(db.Integer, default=7)

    email_sent = db.Column(db.Boolean,default=False)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )