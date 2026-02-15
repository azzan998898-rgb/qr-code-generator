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
        // --- SVG FORMAT ---
        if (format.toLowerCase() === 'svg') {
            // Generate the raw SVG string
            let svgString = await QRCode.toString(text, { ...options, type: 'svg' });
            
            /** * FIX: Some browsers need the XML declaration to render correctly 
             * when sent as a standalone file.
             */
            if (!svgString.includes('xmlns')) {
                svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
            }

            res.setHeader('Content-Type', 'image/svg+xml');
            // We use .send() to keep it as raw image data
            return res.status(200).send(svgString);
        }

        // --- PNG FORMAT ---
        const qrDataUri = await QRCode.toDataURL(text, options);
        res.status(200).json({
            success: true,
            format: 'png',
            data: qrDataUri
        });

    } catch (err) {
        res.status(500).send(`Generation failed: ${err.message}`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));