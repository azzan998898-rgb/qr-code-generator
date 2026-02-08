const express = require('express');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.status(200).send('QR Code API is Online.'));

app.post('/generate', async (req, res) => {
    const { 
        text, 
        color = '#000000', 
        bgColor = '#FFFFFF', 
        errorLevel = 'M',
        format = 'png' 
    } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text content is required' });
    }

    const options = {
        errorCorrectionLevel: errorLevel,
        margin: 1,
        color: {
            dark: color,
            light: bgColor
        }
    };

    try {
        // --- SVG FORMAT ---
        if (format === 'svg') {
            const svgString = await QRCode.toString(text, { ...options, type: 'svg' });
            return res.status(200).json({ 
                success: true, 
                format: 'svg', 
                data: svgString 
            });
        }

        // --- PDF FORMAT ---
        if (format === 'pdf') {
            // Generate a high-res buffer for the PDF
            const qrBuffer = await QRCode.toBuffer(text, { ...options, type: 'png', width: 600 });
            const doc = new PDFDocument({ size: [300, 300], margin: 0 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=qrcode.pdf');
            
            doc.image(qrBuffer, 0, 0, { width: 300 });
            doc.pipe(res);
            return doc.end();
        }

        // --- PNG (DEFAULT) ---
        const qrDataUri = await QRCode.toDataURL(text, { ...options, width: 600 });
        res.status(200).json({
            success: true,
            format: 'png',
            data: qrDataUri,
            message: 'QR code generated as Base64 string'
        });

    } catch (err) {
        res.status(500).json({ error: 'Generation failed', details: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`QR API running on port ${PORT}`));
