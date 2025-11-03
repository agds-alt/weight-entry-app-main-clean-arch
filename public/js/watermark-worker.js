/**
 * Web Worker for Watermark Processing (Offscreen Canvas)
 * Runs watermark processing in background thread to prevent UI freezing
 *
 * Browser Support: Chrome 69+, Firefox 105+, Safari 16.4+
 * Fallback: Main thread processing for older browsers
 */

self.addEventListener('message', async function(e) {
    const { fileBlob, timestamp, location, width, height } = e.data;

    try {
        // Create image bitmap from blob (async, off-main-thread)
        const imageBitmap = await createImageBitmap(fileBlob);

        // Create offscreen canvas (doesn't block main thread)
        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d');

        // Draw original image
        ctx.drawImage(imageBitmap, 0, 0);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Build watermark text
        const date = new Date(timestamp);
        const dateStr = date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');

        const timeStr = date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const locationStr = location?.address || 'Lokasi tidak tersedia';
        const coordsStr = location?.coords
            ? `Lat: ${location.coords.lat.toFixed(6)}, Lon: ${location.coords.lon.toFixed(6)}`
            : '';

        const lines = [`${dateStr} ${timeStr}`, locationStr, coordsStr].filter(line => line);

        // Watermark styling (optimized size from Phase 1)
        const fontSize = Math.max(38, Math.min(50, canvasWidth / 16.67));
        ctx.font = `bold ${fontSize}px Arial`;

        const lineHeight = fontSize * 1.4;
        const padding = fontSize * 1.2;

        // Calculate box dimensions
        let maxWidth = 0;
        for (const line of lines) {
            const textWidth = ctx.measureText(line).width;
            if (textWidth > maxWidth) maxWidth = textWidth;
        }

        const boxWidth = maxWidth + (padding * 2);
        const boxHeight = (lines.length * lineHeight) + (padding * 1.5);
        const margin = 20;
        const boxX = canvasWidth - boxWidth - margin;
        const boxY = canvasHeight - boxHeight - margin;

        // Draw semi-transparent background (energy saving opacity!)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw text with shadow
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        lines.forEach((line, index) => {
            const textX = boxX + padding;
            const textY = boxY + padding + (index * lineHeight);
            ctx.fillText(line, textX, textY);
        });

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Convert to blob with quality optimization
        const quality = canvasWidth > 1500 ? 0.85 : 0.90;
        const blob = await canvas.convertToBlob({
            type: 'image/jpeg',
            quality: quality
        });

        // Send result back to main thread
        self.postMessage({
            success: true,
            blob: blob
        });

    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message || 'Watermark processing failed'
        });
    }
});
