document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("productForm");

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const productId =
            window.location.pathname.split("/").pop();

        const updatedData = {

            product_name:
                document.getElementById("name").value,

            category:
                document.getElementById("category").value,

            batch_number:
                document.getElementById("batch").value,

            quantity:
                document.getElementById("quantity").value,

            expiry_date:
                document.getElementById("expiry").value,

            alert_threshold:
                document.getElementById("threshold").value
        };

        try {

            const response = await fetch(
                `/update-product/${productId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(updatedData)
                }
            );

            const result =
                await response.json();

            if (result.success) {

                alert(
                    "Product updated successfully!"
                );

                window.location.href =
                    "/dashboard";

            } else {

                alert(result.message);
            }

        } catch (error) {

            console.error(error);

            alert(
                "Error updating product."
            );
        }
    });
});