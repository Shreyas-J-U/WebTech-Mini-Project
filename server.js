const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 5000;

// Allow cross-origin requests for frontend to access the API
app.use(cors());

// Serve static files (like HTML, CSS, JS) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Route for the root URL "/"
app.get('/', (req, res) => {
    res.send('Welcome to the Product Scraper API!');
});

// Function to fetch product data from Amazon
async function fetchAmazonProducts(query) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const url = `https://www.amazon.in/s?k=${query}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract product details (example: name, image, price)
    const products = await page.evaluate(() => {
        const productList = [];
        const productElements = document.querySelectorAll('.s-main-slot .s-result-item');

        productElements.forEach(product => {
            const name = product.querySelector('h2') ? product.querySelector('h2').innerText : 'No name';
            const image = product.querySelector('img') ? product.querySelector('img').src : 'No image';
            const price = product.querySelector('.a-price-whole') ? product.querySelector('.a-price-whole').innerText : 'Price not available';
            const url = product.querySelector('a') ? 'https://www.amazon.in' + product.querySelector('a').getAttribute('href') : '#';
            const rating = product.querySelector('.a-icon-alt') ? product.querySelector('.a-icon-alt').innerText : '0';

            productList.push({ name, price, image, url, rating });
        });

        return productList;
    });

    await browser.close();
    return products;
}

// Function to fetch product data from Flipkart
async function fetchFlipkartProducts(query) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const url = `https://www.flipkart.com/search?q=${query}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract product details (example: name, image, price)
    const products = await page.evaluate(() => {
        const productList = [];
        const productElements = document.querySelectorAll('._1AtVbE');

        productElements.forEach(product => {
            const name = product.querySelector('a') ? product.querySelector('a').getAttribute('title') : 'No name';
            const image = product.querySelector('img') ? product.querySelector('img').src : 'No image';
            const price = product.querySelector('._30jeq3') ? product.querySelector('._30jeq3').innerText : 'Price not available';
            const url = product.querySelector('a') ? 'https://www.flipkart.com' + product.querySelector('a').getAttribute('href') : '#';
            const rating = product.querySelector('._3LWZlK') ? product.querySelector('._3LWZlK').innerText : '0';

            productList.push({ name, price, image, url, rating });
        });

        return productList;
    });

    await browser.close();
    return products;
}

// Function to fetch product details from Amazon product page
async function fetchProductDetails(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url);

    // Extract product details from the individual product page
    const details = await page.evaluate(() => {
        const name = document.querySelector('span#productTitle') ? document.querySelector('span#productTitle').innerText : 'No name';
        const price = document.querySelector('.a-price-whole') ? document.querySelector('.a-price-whole').innerText : 'N/A';
        const rating = document.querySelector('.a-icon-alt') ? document.querySelector('.a-icon-alt').innerText : '0';
        const description = document.querySelector('#productDescription') ? document.querySelector('#productDescription').innerText : 'No description available';

        return { name, price, rating, description };
    });

    await browser.close();
    return details;
}

// API endpoint for searching products
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        // Fetch product data from multiple sources
        const amazonProducts = await fetchAmazonProducts(query);
        const flipkartProducts = await fetchFlipkartProducts(query);

        // Combine the results into one list
        const allProducts = [...amazonProducts, ...flipkartProducts];

        res.json(allProducts);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching product data.' });
    }
});

// API endpoint for fetching detailed product information
app.get('/api/product-details', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'Product URL is required' });
    }

    try {
        const productDetails = await fetchProductDetails(url);
        res.json(productDetails);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching product details.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
