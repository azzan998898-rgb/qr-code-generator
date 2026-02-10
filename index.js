const express = require('express');
const QRCode = require('qrcode');
const { createCanvas } = require('canvas'); // New dependency for custom drawing
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to draw rounded QR codes
async function generateElegantQR(text, size, color, bgColor, errorLevel) {
    // 1. Get the raw modules (the grid of 1s and 0s)
    const qr = QRCode.create(text, { errorCorrectionLevel: errorLevel });
    const modules = qr.modules;
    const moduleCount = modules.size;
    const cellSize = size / moduleCount;

    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 2. Fill Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // 3. Draw Dots (Instagram Style)
    ctx.fillStyle = color;
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (modules.get(row, col)) {
                // Check if this is part of the "Eyes" (the 3 big corner squares)
                const isEye = (row < 7 && col < 7) || (row < 7 && col >= moduleCount - 7) || (row >= moduleCount - 7 && col < 7);

                if (isEye) {
                    // Draw a slightly rounded square for the eyes
                    ctx.beginPath();
                    ctx.roundRect(col * cellSize, row * cellSize, cellSize, cellSize, cellSize * 0.2);
                    ctx.fill();
                } else {
                    // Draw a perfect circle for the data dots
                    ctx.beginPath();
                    ctx.arc(
                        col * cellSize + cellSize / 2,
                        row * cellSize + cellSize / 2,
                        cellSize * 0.4, // Adjust this for dot thickness (0.5 is touching)
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
            }
        }
    }

    return canvas.toDataURL('image/png');
}

app.post('/generate', async (req, res) => {
    const { 
        text, 
        color = '#000000', 
        bgColor = '#FFFFFF', 
        errorLevel = 'H', 
        size = 512 
    } = req.body;

    if (!text) return res.status(400).json({ success: false, error: 'Text required' });

    try {
        const qrDataUri = await generateElegantQR(text, parseInt(size), color, bgColor, errorLevel);
        
        res.status(200).json({
            success: true,
            format: 'png',
            style: 'elegant-dot',
            data: qrDataUri
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(process.env.PORT || 3000);