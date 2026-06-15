const signupForm = document.getElementById("signupForm");
const passwordInput = document.getElementById("password");
const requirementsBox =
document.getElementById("passwordRequirements");

const errorMessage =
document.getElementById("errorMessage");

const successMessage =
document.getElementById("successMessage");

passwordInput.addEventListener("input", () => {

```
const password = passwordInput.value;

requirementsBox.classList.add("show");

updateRequirement(
    "req-length",
    password.length >= 8
);

updateRequirement(
    "req-uppercase",
    /[A-Z]/.test(password)
);

updateRequirement(
    "req-number",
    /[0-9]/.test(password)
);

updateRequirement(
    "req-special",
    /[^A-Za-z0-9]/.test(password)
);
```

});

function updateRequirement(id, passed){
const item = document.getElementById(id);

```
if(passed){
    item.classList.add("met");
}else{
    item.classList.remove("met");
}
```

}

signupForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    errorMessage.classList.remove("show");
    successMessage.classList.remove("show");

    const fullName =
        document.getElementById("fullName").value;

    const email =
        document.getElementById("email").value;

    const company =
        document.getElementById("company").value;

    const password =
        document.getElementById("password").value;

    const terms =
        document.getElementById("terms").checked;

    if (
        !fullName ||
        !email ||
        !company ||
        !password
    ) {

        errorMessage.textContent =
            "Please fill all fields.";

        errorMessage.classList.add("show");

        return;
    }

    if (!terms) {

        errorMessage.textContent =
            "Accept the terms first.";

        errorMessage.classList.add("show");

        return;
    }

    try {

        const response = await fetch("/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                full_name: fullName,
                email: email,
                company: company,
                password: password

            })

        });

        const result = await response.json();

        if (result.success) {

            successMessage.textContent =
                "Account created successfully.";

            successMessage.classList.add("show");

            setTimeout(() => {

                window.location.href = "/login";

            }, 1500);

        } else {

            errorMessage.textContent =
                result.message;

            errorMessage.classList.add("show");
        }

    } catch (error) {

        errorMessage.textContent =
            "Server error. Try again.";

        errorMessage.classList.add("show");

        console.error(error);
    }

});