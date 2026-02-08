const express = require('express');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check for hosting platforms (Render/Railway)
app.get('/', (req, res) => res.status(200).send('Custom QR API v1.3 - Status: Online'));

/**
 * POST /generate
 * Parameters: text, color, bgColor, errorLevel, format, size
 */
app.post('/generate', async (req, res) => {
    const { 
        text, 
        color = '#000000', 
        bgColor = '#FFFFFF', 
        errorLevel = 'M', // L, M, Q, H
        format = 'png',   // png, svg, pdf
        size = 400        // width/height in pixels
    } = req.body;

    // Basic Validation
    if (!text) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing "text" parameter in request body.' 
        });
    }

    // QR Configuration
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
        // --- 1. SVG FORMAT (Returns XML String) ---
        if (format.toLowerCase() === 'svg') {
            const svgString = await QRCode.toString(text, { ...options, type: 'svg' });
            return res.status(200).json({ 
                success: true, 
                format: 'svg', 
                size: size,
                data: svgString 
            });
        }

        // --- 2. PDF FORMAT (Returns File Stream) ---
        if (format.toLowerCase() === 'pdf') {
            // Generate a buffer first to embed in PDF
            const qrBuffer = await QRCode.toBuffer(text, { ...options, type: 'png' });
            
            // PDF size matches the QR size (converted to points)
            const doc = new PDFDocument({ size: [size, size], margin: 0 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="qrcode.pdf"`);
            
            doc.image(qrBuffer, 0, 0, { width: size });
            doc.pipe(res);
            return doc.end();
        }

        // --- 3. PNG FORMAT (Default - Returns Base64) ---
        const qrDataUri = await QRCode.toDataURL(text, options);
        
        return res.status(200).json({
            success: true,
            format: 'png',
            size: `${size}x${size}`,
            data: qrDataUri,
            instructions: "Use the data string directly in an <img src='...'> tag."
        });

    } catch (err) {
        console.error('QR Gen Error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Internal Server Error', 
            details: err.message 
        });
    }
});

// Set port and start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 QR Code Generator API running on port ${PORT}`);
});