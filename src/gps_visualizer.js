const socket = new WebSocket('ws://localhost:4001');
let satellites = [];

function calculateDistanceFromTime(sentAt, receivedAt) {
    const speedOfLight = 299792.458;
    const timeOfFlight = (receivedAt - sentAt) / 1000; 
    return speedOfLight * timeOfFlight;
}

function trilateration(satellites) {
    if (satellites.length < 3) return null;

    const [sat1, sat2, sat3] = satellites.slice(0, 3);

    const A = 2 * (sat2.x - sat1.x);
    const B = 2 * (sat2.y - sat1.y);
    const C = Math.pow(sat1.r, 2) - Math.pow(sat2.r, 2) - 
              Math.pow(sat1.x, 2) + Math.pow(sat2.x, 2) - 
              Math.pow(sat1.y, 2) + Math.pow(sat2.y, 2);

    const D = 2 * (sat3.x - sat2.x);
    const E = 2 * (sat3.y - sat2.y);
    const F = Math.pow(sat2.r, 2) - Math.pow(sat3.r, 2) - 
              Math.pow(sat2.x, 2) + Math.pow(sat3.x, 2) - 
              Math.pow(sat2.y, 2) + Math.pow(sat3.y, 2);

    const x = (C * E - F * B) / (E * A - B * D);
    const y = (C * D - A * F) / (B * D - A * E);

    return { x, y };
}

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    const existingSatellite = satellites.find(sat => sat.id === data.id);
    if (existingSatellite) {
        existingSatellite.x = data.x;
        existingSatellite.y = data.y;
        existingSatellite.r = calculateDistanceFromTime(data.sentAt, data.receivedAt);
    } else {
        satellites.push({
            id: data.id,
            x: data.x,
            y: data.y,
            r: calculateDistanceFromTime(data.sentAt, data.receivedAt)
        });
    }

    if (satellites.length > 3) {
        satellites = satellites.slice(-3);
    }

    const objectPosition = trilateration(satellites);
    if (objectPosition) {
        updateGraph(objectPosition);
    }
};

function updateGraph(objectPosition) {
    Plotly.react('graph', [
        {
            x: satellites.map(sat => sat.x),
            y: satellites.map(sat => sat.y),
            mode: 'markers',
            type: 'scatter',
            name: 'Satellites',
            marker: { color: 'blue', size: 10 }
        },
        {
            x: [objectPosition.x],
            y: [objectPosition.y],
            mode: 'markers',
            type: 'scatter',
            name: 'Object',
            marker: { color: 'red', size: 15 }
        }
    ], {
        title: 'GPS Visualization',
        xaxis: {
            title: 'X Distance (km)',
            autorange: false,  
            range: [-200, 200]
        },
        yaxis: {
            title: 'Y Distance (km)',
            autorange: false,  
            range: [-200, 200]
        },
    });
}

document.getElementById('gps-settings').addEventListener('submit', function(event) {
    event.preventDefault();
    const satelliteSpeed = parseFloat(document.getElementById('satelliteSpeed').value);
    const objectSpeed = parseFloat(document.getElementById('objectSpeed').value);

    fetch('http://localhost:4001/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            satelliteSpeed,
            objectSpeed
        })
    })
    .then(response => response.json())
    .then(data => console.log('GPS parameters updated:', data))
    .catch(error => console.error('Error updating GPS parameters:', error));
});