let allProducts = []; // Store all products globally

document.getElementById('searchButton').addEventListener('click', async function() {
    const query = document.getElementById('searchInput').value;
    if (query.trim() === '') return;

    // Send a request to the backend to fetch product data
    const response = await fetch(`/api/search?q=${query}`);
    allProducts = await response.json(); // Store the fetched products

    // Trigger the filtering and sorting to display based on the initial filter setting
    filterAndSortProducts();
});

// Add event listener to the rating filter dropdown
document.getElementById('ratingFilter').addEventListener('change', function() {
    filterAndSortProducts(); // Filter and sort products whenever the rating is changed
});

// Filter and sort the products based on selected rating
function filterAndSortProducts() {
    const selectedRating = parseFloat(document.getElementById('ratingFilter').value); // Get the selected rating

    // Filter products based on the selected rating
    const filteredProducts = allProducts.filter(product => {
        const productRating = parseFloat(product.rating) || 0; // Default to 0 if no rating is available
        return productRating >= selectedRating;
    });

    // Sort products by price (ascending)
    const sortedProducts = filteredProducts.sort((a, b) => {
        // Extract price and convert to number, removing non-numeric characters
        const priceA = parseFloat(a.price.replace(/[^\d.-]/g, '')) || 0;
        const priceB = parseFloat(b.price.replace(/[^\d.-]/g, '')) || 0;
        return priceA - priceB; // Sort in ascending order of price
    });

    displayProducts(sortedProducts); // Display the filtered and sorted products
}

// Function to display products in the product list
function displayProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';  // Clear previous results

    if (products.length === 0) {
        productList.innerHTML = '<p>No products found with the selected rating.</p>';
    } else {
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            const productImage = document.createElement('img');
            productImage.src = product.image;
            productImage.alt = product.name;

            const productTitle = document.createElement('h3');
            productTitle.textContent = product.name;

            const productPrice = document.createElement('p');
            productPrice.textContent = `Price: ${product.price}`;

            const productButton = document.createElement('button');
            productButton.textContent = 'View Product';
            productButton.onclick = () => openModal(product);

            productCard.appendChild(productImage);
            productCard.appendChild(productTitle);
            productCard.appendChild(productPrice);
            productCard.appendChild(productButton);

            productList.appendChild(productCard);
        });
    }
}

// Open the modal with detailed product info
async function openModal(product) {
    document.getElementById('modalProductTitle').textContent = product.name;
    document.getElementById('modalProductImage').src = product.image;
    document.getElementById('modalProductPrice').textContent = product.price;
    document.getElementById('modalProductRating').textContent = product.rating;

    // Fetch detailed product information (including description) from the backend
    const response = await fetch(`/api/product-details?url=${product.url}`);
    const details = await response.json();

    document.getElementById('modalProductDescription').textContent = details.description || 'No description available';
    document.getElementById('modalProductLink').href = product.url;

    document.getElementById('productModal').style.display = 'block';
}

// Close the modal
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('productModal').style.display = 'none';
});

// Close modal when clicking outside the modal content
window.onclick = function(event) {
    if (event.target === document.getElementById('productModal')) {
        document.getElementById('productModal').style.display = 'none';
    }
};
