const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Wraps text into lines that fit within a given width.
 */
function wrapText(text, maxCharsPerLine) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + 1 + words[i].length <= maxCharsPerLine) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

/**
 * Escapes special XML characters for SVG text content.
 */
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Generates a Greeting Card combining the Face-Swap Image and the User's Story.
 * Layout: Side-by-Side (Left: Image, Right: Text)
 * Dynamically scales to fit up to 150 words.
 */
async function createGreetingCard(imagePath, story, outputPath) {
    try {
        const width = 1200;
        const halfWidth = width / 2;

        // Default Story if empty
        const finalStory = story && story.trim().length > 0
            ? story
            : "To the world you are a mother, but to our family you are a superhero.";

        // Determine text sizing based on word count
        const wordCount = finalStory.trim().split(/\s+/).length;

        let bodyFontSize, lineHeight, maxCharsPerLine, titleFontSize;

        if (wordCount <= 30) {
            // Short story
            bodyFontSize = 24;
            lineHeight = 34;
            maxCharsPerLine = 34;
            titleFontSize = 36;
        } else if (wordCount <= 60) {
            // Medium story
            bodyFontSize = 20;
            lineHeight = 30;
            maxCharsPerLine = 38;
            titleFontSize = 32;
        } else if (wordCount <= 100) {
            // Long story
            bodyFontSize = 17;
            lineHeight = 25;
            maxCharsPerLine = 42;
            titleFontSize = 28;
        } else {
            // Very long story (up to 150 words)
            bodyFontSize = 14;
            lineHeight = 21;
            maxCharsPerLine = 48;
            titleFontSize = 26;
        }

        // Wrap text and compute required height
        const lines = wrapText(escapeXml(finalStory), maxCharsPerLine);
        const titleAreaHeight = 120; // Title + separator + spacing
        const footerHeight = 60;     // Hashtag + bottom padding
        const topPadding = 40;
        const textContentHeight = lines.length * lineHeight;
        const requiredTextHeight = topPadding + titleAreaHeight + textContentHeight + footerHeight;

        // Card height: at least 600px, but taller if needed
        const height = Math.max(600, requiredTextHeight + 40);

        // 1. Prepare the Face Swap Image (Left Side)
        const imageBuffer = await sharp(imagePath)
            .resize({
                width: halfWidth,
                height: height,
                fit: 'cover',
                position: 'top'
            })
            .toBuffer();

        // 2. Generate Text SVG (Right Side)
        const title = "HAPPY MOTHER'S DAY!";
        const startY = topPadding + titleAreaHeight;

        let textSvgContent = `
      <svg width="${halfWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .title { fill: #F60945; font-family: sans-serif; font-weight: bold; font-size: ${titleFontSize}px; text-anchor: middle; letter-spacing: 1px; }
          .body { fill: #444444; font-family: sans-serif; font-style: italic; font-size: ${bodyFontSize}px; text-anchor: middle; }
          .footer { fill: #F60945; font-family: sans-serif; font-weight: bold; font-size: 16px; text-anchor: middle; }
        </style>
        
        <!-- Corner Decorations -->
        <path d="M540 0 L600 0 L600 60 Z" fill="#F60945" fill-opacity="0.2" />
        <path d="M0 ${height} L0 ${height - 60} L60 ${height} Z" fill="#F60945" fill-opacity="0.2" />

        <!-- Title -->
        <text x="300" y="${topPadding + 50}" class="title">${title}</text>
        
        <!-- Separator -->
        <rect x="270" y="${topPadding + 65}" width="60" height="4" rx="2" fill="#FFC700" />
    `;

        // Add Story Lines (opening quote on first line, closing on last)
        lines.forEach((line, index) => {
            let displayLine = line;
            if (index === 0) displayLine = `"${displayLine}`;
            if (index === lines.length - 1) displayLine = `${displayLine}"`;
            textSvgContent += `<text x="300" y="${startY + (index * lineHeight)}" class="body">${displayLine}</text>`;
        });

        // Footer
        const footerY = Math.min(height - 30, startY + (lines.length * lineHeight) + 40);
        textSvgContent += `
        <text x="300" y="${footerY}" class="footer">#KelloggsSuperMom</text>
      </svg>
    `;

        const textBuffer = Buffer.from(textSvgContent);

        // 3. Composite: white canvas + image left + text right
        await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
            .composite([
                { input: imageBuffer, left: 0, top: 0 },
                { input: textBuffer, left: halfWidth, top: 0 }
            ])
            .jpeg({ quality: 90, mozjpeg: true })
            .toFile(outputPath);

        console.log(`✅ Greeting Card Generated: ${outputPath} (${width}x${height}, ${wordCount} words, ${lines.length} lines)`);
        return outputPath;

    } catch (error) {
        console.error('❌ Error creating greeting card:', error);
        // If card generation fails, just copy the original image to output (fallback)
        try {
            fs.copyFileSync(imagePath, outputPath);
        } catch (e) {
            console.error('Fallback copy failed', e);
        }
        return imagePath;
    }
}

module.exports = { createGreetingCard };
