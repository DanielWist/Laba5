const express = require('express');
const path = require('path');

const app = express();

let gpsConfig = {
    satelliteSpeed: 100,
    objectSpeed: 10,
};

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/config', express.json(), (req, res) => {
    const { satelliteSpeed, objectSpeed } = req.body;

    if (typeof satelliteSpeed === 'number' && typeof objectSpeed === 'number') {
        gpsConfig = { satelliteSpeed, objectSpeed };
        console.log('GPS parameters updated:', gpsConfig);
        res.json({ status: 'success', updatedConfig: gpsConfig });
    } else {
        res.status(400).json({ status: 'error', message: 'Invalid parameters' });
    }
});

const PORT = 4002;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
