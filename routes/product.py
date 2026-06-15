from flask import request, jsonify, session
from models import db, Product
from datetime import datetime


def add_product():

    if not session.get("user_id"):
        return jsonify({
            "success": False,
            "message": "Login required"
        }), 401

    data = request.get_json()

    expiry_date = datetime.strptime(
        data.get("expiry_date"),
        "%Y-%m-%d"
    ).date()

    new_product = Product(
        product_name=data.get("product_name"),
        category=data.get("category"),
        quantity=int(data.get("quantity", 0)),
        batch_number=data.get("batch_number"),
        expiry_date=expiry_date,
        alert_threshold=int(data.get("alert_threshold", 7)),
        user_id=session.get("user_id")
    )

    db.session.add(new_product)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Product added successfully"
    })


def get_products():

    if not session.get("user_id"):
        return jsonify([])

    products = Product.query.filter_by(
        user_id=session.get("user_id")
    ).all()

    product_list = []

    for product in products:

        product_list.append({
            "id": product.id,
            "product_name": product.product_name,
            "category": product.category,
            "quantity": product.quantity,
            "batch_number": product.batch_number,
            "expiry_date": str(product.expiry_date),
            "alert_threshold": product.alert_threshold
        })

    return jsonify(product_list)


def get_product(product_id):

    product = Product.query.filter_by(
        id=product_id,
        user_id=session.get("user_id")
    ).first()

    if not product:
        return jsonify({
            "success": False,
            "message": "Product not found"
        })

    return jsonify({
        "id": product.id,
        "product_name": product.product_name,
        "category": product.category,
        "quantity": product.quantity,
        "batch_number": product.batch_number,
        "expiry_date": str(product.expiry_date),
        "alert_threshold": product.alert_threshold
    })


def update_product(product_id):

    product = Product.query.filter_by(
        id=product_id,
        user_id=session.get("user_id")
    ).first()

    if not product:
        return jsonify({
            "success": False,
            "message": "Product not found"
        })

    data = request.get_json()

    product.product_name = data.get(
        "product_name"
    )

    product.category = data.get(
        "category"
    )

    product.quantity = int(
        data.get("quantity", product.quantity)
    )

    product.batch_number = data.get(
        "batch_number",
        product.batch_number
    )

    product.expiry_date = datetime.strptime(
        data.get("expiry_date"),
        "%Y-%m-%d"
    ).date()

    product.alert_threshold = int(
        data.get(
            "alert_threshold",
            product.alert_threshold
        )
    )

    # Allow new alert email if product is edited
    product.email_sent = False

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Product updated successfully"
    })


def delete_product(product_id):

    product = Product.query.filter_by(
        id=product_id,
        user_id=session.get("user_id")
    ).first()

    if not product:
        return jsonify({
            "success": False,
            "message": "Product not found"
        })

    db.session.delete(product)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Product deleted successfully"
    })