const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => res.status(200).send('QR Generator API is online.'));

/**
 * POST /generate
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

    if (!text) {
        return res.status(400).json({ success: false, error: 'Text content is required' });
    }

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
        // SVG Format
        if (format.toLowerCase() === 'svg') {
            const svgString = await QRCode.toString(text, { ...options, type: 'svg' });
            return res.status(200).json({
                success: true,
                format: 'svg',
                size: size,
                data: svgString
            });
        }

        // PNG Format (Default)
        const qrDataUri = await QRCode.toDataURL(text, options);
        res.status(200).json({
            success: true,
            format: 'png',
            size: `${size}x${size}`,
            data: qrDataUri
        });

    } catch (err) {
        res.status(500).json({ success: false, error: 'Generation failed', details: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));