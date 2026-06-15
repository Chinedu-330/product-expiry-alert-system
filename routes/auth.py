from flask import request, jsonify, session
from models import db, User
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def register_user():

    data = request.get_json()

    full_name = data.get("full_name")
    email = data.get("email")
    company = data.get("company")
    password = data.get("password")

    # Check if email already exists
    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "success": False,
            "message": "Email already exists"
        })

    # Hash password
    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    new_user = User(
        full_name=full_name,
        email=email,
        company=company,
        password=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Account created successfully"
    })

def login_user():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "success": False,
            "message": "Email not found"
        })

    if bcrypt.check_password_hash(
        user.password,
        password
    ):

        session["user_id"] = user.id
        session["user_full_name"] = user.full_name
        session["user_email"] = user.email
        session["user_username"] = user.email.split("@")[0]

        return jsonify({
            "success": True,
            "message": "Login successful"
        })

    return jsonify({
        "success": False,
        "message": "Incorrect password"
    })