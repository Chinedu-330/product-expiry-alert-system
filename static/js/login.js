document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        errorMessage.style.display = "none";
        successMessage.style.display = "none";

        if (!email || !password) {

            errorMessage.textContent =
                "Please enter email and password.";

            errorMessage.style.display = "block";
            return;
        }

        try {

            const response = await fetch("/login-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {

                successMessage.textContent =
                    data.message;

                successMessage.style.display = "block";

                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);

            } else {

                errorMessage.textContent =
                    data.message;

                errorMessage.style.display = "block";
            }

        } catch (error) {

            errorMessage.textContent =
                "Server error. Please try again.";

            errorMessage.style.display = "block";

            console.error(error);
        }

    });

});