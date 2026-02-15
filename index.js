const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Health Check
 */
app.get('/', (req, res) => res.status(200).send('QR Generator API is online.'));

/**
 * POST /generate
 * Returns RAW SVG for clean viewing or JSON for PNG Base64.
 */
app.post('/generate', async (req, res) => {
    const { 
        text, 
        color = '#000000', 
        bgColor = '#FFFFFF', 
        errorLevel = 'M',
        format = 'png',
        size = 400 
    } = req.body;

    if (!text) return res.status(400).send('Error: Text is required');

    const options = {
        errorCorrectionLevel: errorLevel,
        margin: 1,
        width: parseInt(size),
        color: {
            dark: color,
            light: bgColor
        }
    };

    try {
        // --- SVG FORMAT (Direct Raw Response) ---
        if (format.toLowerCase() === 'svg') {
            const svgString = await QRCode.toString(text, { ...options, type: 'svg' });
            
            // This header tells browsers and apps "This is an image, not just text"
            res.setHeader('Content-Type', 'image/svg+xml');
            
            // We send the string directly. 
            // This prevents JSON from adding backslashes (\") to the quotes.
            return res.status(200).send(svgString);
        }

        // --- PNG FORMAT (JSON Response) ---
        const qrDataUri = await QRCode.toDataURL(text, options);
        
        res.status(200).json({
            success: true,
            format: 'png',
            size: `${size}x${size}`,
            data: qrDataUri,
            message: 'Use this string in the src attribute of an <img> tag.'
        });

    } catch (err) {
        res.status(500).send(`Generation failed: ${err.message}`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));