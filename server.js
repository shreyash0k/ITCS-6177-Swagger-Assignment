const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const lambdaUrl = 'https://fac3t7w384.execute-api.ap-south-1.amazonaws.com/say';

app.get('/say', async (req, res) => {
    const keyword = req.query.keyword;

    if (!keyword) {
        return res.status(400).send('Keyword query parameter is required');
    }

    try {
        // Forward the request to AWS Lambda
        const response = await axios.get(`${lambdaUrl}?keyword=${keyword}`);
        res.send(response.data);
    } catch (error) {
        console.error('Error calling AWS Lambda:', error.message);
        res.status(500).send('An error occurred while forwarding the request to AWS Lambda');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

