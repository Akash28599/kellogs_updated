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
async function createGreetingCard(imagePath, story, outputPath, momName, momAlias) {
    try {
        const width = 2400;
        const halfWidth = width / 2;

        // Default Story if empty
        const finalStory = story && story.trim().length > 0
            ? story
            : "To the world you are a mother, but to our family you are a superhero.";

        // Construct Greeting
        let greeting = "";
        if (momName) {
            greeting = `Dear ${momName}`;
            if (momAlias) {
                greeting += ` (${momAlias})`;
            }
            greeting += ",";
        }

        // Determine text sizing based on word count
        const wordCount = finalStory.trim().split(/\s+/).length;

        let bodyFontSize, lineHeight, maxCharsPerLine, titleFontSize, greetingFontSize;

        if (wordCount <= 30) {
            bodyFontSize = 48;
            lineHeight = 68;
            maxCharsPerLine = 34;
            titleFontSize = 72;
            greetingFontSize = 52;
        } else if (wordCount <= 60) {
            bodyFontSize = 40;
            lineHeight = 60;
            maxCharsPerLine = 38;
            titleFontSize = 64;
            greetingFontSize = 44;
        } else if (wordCount <= 100) {
            bodyFontSize = 34;
            lineHeight = 50;
            maxCharsPerLine = 42;
            titleFontSize = 56;
            greetingFontSize = 38;
        } else {
            bodyFontSize = 28;
            lineHeight = 42;
            maxCharsPerLine = 48;
            titleFontSize = 52;
            greetingFontSize = 32;
        }

        // Wrap text and compute required height
        const lines = wrapText(escapeXml(finalStory), maxCharsPerLine);

        const titleAreaHeight = 240;
        const greetingHeight = greeting ? (lineHeight * 1.5) : 0; // Space for greeting
        const footerHeight = 120;
        const topPadding = 80;
        const textContentHeight = lines.length * lineHeight;
        const requiredTextHeight = topPadding + titleAreaHeight + greetingHeight + textContentHeight + footerHeight;

        // Card height: at least 1200px, but taller if needed
        const height = Math.max(1200, requiredTextHeight + 80);

        // 1. Prepare the Face Swap Image (Left Side)
        const imageBuffer = await sharp(imagePath)
            .resize({
                width: halfWidth,
                height: height,
                fit: 'contain',
                position: 'centre',
                background: { r: 198, g: 7, b: 46, alpha: 1 }
            })
            .toBuffer();

        // 2. Generate Text SVG (Right Side)
        const title = "HAPPY MOTHER'S DAY!";
        // Start Y position for the first element after title
        let currentY = topPadding + titleAreaHeight;

        let textSvgContent = `
      <svg width="${halfWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .title { fill: #F60945; font-family: sans-serif; font-weight: bold; font-size: ${titleFontSize}px; text-anchor: middle; letter-spacing: 2px; }
          .greeting { fill: #F60945; font-family: sans-serif; font-weight: bold; font-size: ${greetingFontSize}px; text-anchor: middle; }
          .body { fill: #444444; font-family: sans-serif; font-style: italic; font-size: ${bodyFontSize}px; text-anchor: middle; }
          .footer { fill: #F60945; font-family: sans-serif; font-weight: bold; font-size: 32px; text-anchor: middle; }
        </style>
        
        <!-- Corner Decorations -->
        <path d="M1080 0 L1200 0 L1200 120 Z" fill="#F60945" fill-opacity="0.2" />
        <path d="M0 ${height} L0 ${height - 120} L120 ${height} Z" fill="#F60945" fill-opacity="0.2" />

        <!-- Title -->
        <text x="600" y="${topPadding + 100}" class="title">${title}</text>
        
        <!-- Separator -->
        <rect x="540" y="${topPadding + 130}" width="120" height="8" rx="4" fill="#FFC700" />
    `;

        // Add Greeting if exists
        if (greeting) {
            textSvgContent += `<text x="600" y="${currentY}" class="greeting">${escapeXml(greeting)}</text>`;
            currentY += greetingHeight;
        }

        // Add Story Lines
        lines.forEach((line, index) => {
            let displayLine = line;
            if (index === 0) displayLine = `"${displayLine}`;
            if (index === lines.length - 1) displayLine = `${displayLine}"`;
            textSvgContent += `<text x="600" y="${currentY + (index * lineHeight)}" class="body">${displayLine}</text>`;
        });

        // Footer
        const footerY = Math.min(height - 60, currentY + (lines.length * lineHeight) + 80);
        textSvgContent += `
        <text x="600" y="${footerY}" class="footer">#KelloggsMorningHero</text>
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
            .jpeg({ quality: 95, mozjpeg: true })
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
