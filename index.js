const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.status(200).send('QR Generator API is online.'));

app.post('/generate', async (req, res) => {
    const { 
        text, 
        color = '#000000', 
        bgColor = '#FFFFFF', 
        errorLevel = 'M',
        format = 'png',
        size = 400 
    } = req.body;

    if (!text) return res.status(400).json({ success: false, error: 'Text is required' });

    const options = {
        errorCorrectionLevel: errorLevel,
        margin: 1,
        width: parseInt(size),
        color: { dark: color, light: bgColor }
    };

    try {
        // --- SVG FORMAT ---
        if (format.toLowerCase() === 'svg') {
            const svgString = await QRCode.toString(text, { ...options, type: 'svg' });
            const base64Svg = Buffer.from(svgString).toString('base64');
            const svgDataUri = `data:image/svg+xml;base64,${base64Svg}`;

            return res.status(200).json({
                success: true,
                format: 'svg',
                data: svgDataUri,
                message: 'SVG generated successfully. Use this string in an <img> tag src or browser address bar.'
            });
        }

        // --- PNG FORMAT ---
        const qrDataUri = await QRCode.toDataURL(text, options);
        
        return res.status(200).json({
            success: true,
            format: 'png',
            size: `${size}x${size}`,
            data: qrDataUri,
            message: 'PNG generated successfully. Use this string in an <img> tag src or browser address bar.'
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));