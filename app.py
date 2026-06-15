from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from config import Config
from models import db, Product, User
from flask_bcrypt import Bcrypt

from routes.auth import register_user, login_user
from routes.product import (
    add_product,
    get_products,
    get_product,
    delete_product,
    update_product
)
from services.email_service import send_smtp_email

import pandas as pd

from io import BytesIO

from flask import send_file

from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle
)

from reportlab.lib import colors

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = app.config["SECRET_KEY"]

# Initialize extensions
db.init_app(app)
bcrypt = Bcrypt(app)

# Create database tables
with app.app_context():
    db.create_all()


def get_user_context():
    if not session.get("user_id"):
        return {
            "user_full_name": "User",
            "user_first_name": "User",
            "user_last_name": "",
            "user_initials": "U",
            "user_email": "user@example.com",
            "user_username": "user"
        }

    user_full_name = session.get("user_full_name", "User")
    name_parts = user_full_name.split()
    user_first_name = name_parts[0] if name_parts else ""
    user_last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
    user_initials = "".join([part[0] for part in name_parts[:2]]).upper() or "U"
    user_email = session.get("user_email", "user@example.com")
    user_username = session.get("user_username") or user_email.split("@")[0]

    return {
        "user_full_name": user_full_name,
        "user_first_name": user_first_name,
        "user_last_name": user_last_name,
        "user_initials": user_initials,
        "user_email": user_email,
        "user_username": user_username
    }


# =========================
# Page Routes
# =========================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/signup")
def signup():
    return render_template("signup.html")


@app.route("/dashboard")
def dashboard():
    if not session.get("user_id"):
        return redirect(url_for("login"))

    context = get_user_context()
    return render_template("dashboard.html", **context)

@app.route("/alerts-history")
def alerts_history():
    if not session.get("user_id"):
        return redirect(url_for("login"))

    context = get_user_context()
    return render_template("alert_history.html", **context)

@app.route("/settings")
def settings():
    if not session.get("user_id"):
        return redirect(url_for("login"))

    context = get_user_context()
    return render_template("settings.html", **context)

@app.route("/settings/backup")
def settings_backup():
    if not session.get("user_id"):
        return redirect(url_for("login"))

    context = get_user_context()
    return render_template("settings_backup.html", **context)

@app.route("/settings/account")
def settings_account():
    if not session.get("user_id"):
        return redirect(url_for("login"))

    context = get_user_context()
    return render_template("settings_account.html", **context)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/update-profile", methods=["POST"])
def update_profile():
    if not session.get("user_id"):
        return jsonify({"success": False, "message": "Login required"}), 401

    data = request.get_json() or {}
    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip()
    username = data.get("username", "").strip() or email.split("@")[0]
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if email and email != user.email:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"success": False, "message": "Email already in use."})
        user.email = email

    if full_name:
        user.full_name = full_name

    if new_password:
        if not current_password or not bcrypt.check_password_hash(user.password, current_password):
            return jsonify({"success": False, "message": "Current password is incorrect."})
        user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")

    db.session.commit()
    session["user_full_name"] = user.full_name
    session["user_email"] = user.email
    session["user_username"] = username

    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "user_full_name": user.full_name,
        "user_email": user.email,
        "user_username": username
    })

@app.route("/send-email-alert", methods=["POST"])
def send_email_alert():
    if not session.get("user_id"):
        return jsonify({"success": False, "message": "Authentication required."}), 401

    data = request.get_json() or {}
    subject = data.get("subject", "Expiry Alert")
    message = data.get("message", "")
    recipient = data.get("recipient") or session.get("user_email")
    sender = data.get("sender")

    if not recipient or not message:
        return jsonify({"success": False, "message": "Recipient email and message are required."}), 400

    try:
        # Build a friendly email body with the alert text.
        email_body = f"{message}\n\nThis notification was generated by ExpiryGuard."
        send_smtp_email(recipient, subject, email_body, sender=sender)
        return jsonify({"success": True, "message": "Alert email sent successfully."})
    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Failed to send email alert.",
            "error": str(error)
        }), 500

# =========================
# Authentication Routes
# =========================

@app.route("/register", methods=["POST"])
def register():
    return register_user()


@app.route("/login-user", methods=["POST"])
def login_route():
    return login_user()


# =========================
# Product Routes
# =========================

@app.route("/add-product", methods=["POST"])
def create_product():
    return add_product()


@app.route("/products", methods=["GET"])
def products():
    return get_products()


@app.route("/delete-product/<int:product_id>", methods=["DELETE"])
def remove_product(product_id):
    return delete_product(product_id)

@app.route("/update-product/<int:product_id>", methods=["PUT"])
def edit_product(product_id):
    return update_product(product_id)

@app.route("/edit-product/<int:product_id>")
def edit_product_page(product_id):

    product = Product.query.get(product_id)

    if not product:
        return "Product not found", 404

    return render_template(
        "edit_product.html",
        product=product
    )

@app.route("/product/<int:product_id>", methods=["GET"])
def product(product_id):
    return get_product(product_id)

@app.route("/test-email")
def test_email():

    send_smtp_email(
        recipient="YOUR_GMAIL@gmail.com",
        subject="ExpiryGuard Test Email",
        body="Congratulations! Your SMTP email configuration is working."
    )

    return "Email sent successfully!"

@app.route("/export-excel")
def export_excel():

    if not session.get("user_id"):
        return redirect(url_for("login"))

    products = Product.query.filter_by(
        user_id=session["user_id"]
    ).all()

    data = []

    for product in products:

        data.append({
            "Product Name": product.product_name,
            "Category": product.category,
            "Quantity": product.quantity,
            "Batch Number": product.batch_number,
            "Expiry Date": product.expiry_date,
            "Alert Threshold": product.alert_threshold
        })

    df = pd.DataFrame(data)

    output = BytesIO()

    with pd.ExcelWriter(
        output,
        engine="openpyxl"
    ) as writer:

        df.to_excel(
            writer,
            index=False,
            sheet_name="Products"
        )

    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name="ExpiryGuard_Products.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
@app.route("/export-pdf")
def export_pdf():

    if not session.get("user_id"):
        return redirect(url_for("login"))

    products = Product.query.filter_by(
        user_id=session["user_id"]
    ).all()

    buffer = BytesIO()

    pdf = SimpleDocTemplate(buffer)

    table_data = [[
        "Product",
        "Category",
        "Quantity",
        "Expiry Date"
    ]]

    for product in products:

        table_data.append([
            product.product_name,
            product.category,
            str(product.quantity),
            str(product.expiry_date)
        ])

    table = Table(table_data)

    table.setStyle(
        TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ])
    )

    pdf.build([table])

    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="ExpiryGuard_Report.pdf",
        mimetype="application/pdf"
    )

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)