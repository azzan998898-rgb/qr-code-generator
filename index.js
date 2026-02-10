const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Health Check Endpoint
 * Useful for RapidAPI monitoring to ensure your service is up.
 */
app.get('/', (req, res) => {
    res.status(200).send('QR Generator API is online and ready.');
});

/**
 * POST /generate
 * Primary endpoint for RapidAPI Marketplace
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

    // Validation: Ensure text is provided
    if (!text) {
        return res.status(400).json({ 
            success: false, 
            error: 'Text content is required' 
        });
    }

    // QR Code configuration options
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
        // Handle SVG Format
        if (format.toLowerCase() === 'svg') {
            const svgString = await QRCode.toString(text, { ...options, type: 'svg' });
            return res.status(200).json({
                success: true,
                format: 'svg',
                size: size,
                data: svgString,
                message: 'QR code generated as raw SVG XML code.'
            });
        }

        // Handle PNG Format (Default)
        // This generates a Base64 Data URI
        const qrDataUri = await QRCode.toDataURL(text, options);
        
        res.status(200).json({
            success: true,
            format: 'png',
            size: `${size}x${size}`,
            data: qrDataUri,
            message: 'QR code generated as Base64 string. Use this in the src attribute of an <img> tag.'
        });

    } catch (err) {
        console.error('Generation Error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Generation failed', 
            details: err.message 
        });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API is running on port ${PORT}`);
});