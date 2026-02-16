const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Wraps text into lines that fit within a given width.
 */
function wrapText(text, maxCharsPerLine) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + 1 + words[i].length <= maxCharsPerLine) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
}

/**
 * Generates a Greeting Card combining the Face-Swap Image and the User's Story.
 * Layout: Side-by-Side (Left: Image, Right: Text)
 * Dimensions: 1200x600 (2:1 Ratio)
 */
async function createGreetingCard(imagePath, story, outputPath) {
    try {
        const width = 1200;
        const height = 600;
        const halfWidth = width / 2;

        // Default Story if empty
        const finalStory = story && story.trim().length > 0
            ? story
            : "To the world you are a mother, but to our family you are a superhero.";

        // 1. Prepare the Face Swap Image (Left Side)
        // Resize to cover the left half (600x600)
        const imageBuffer = await sharp(imagePath)
            .resize({
                width: 600,
                height: 600,
                fit: 'cover',
                position: 'top' // Focus on faces usually at top
            })
            .toBuffer();

        // Generate Text SVG
        const title = "HAPPY MOTHER'S DAY";
        const titleFontSize = 42;
        const bodyFontSize = 30;
        const lineHeight = 40;
        const startY = 220;

        let textSvgContent = `
      <svg width="600" height="600">
        <style>
          .title { fill: #FFD700; font-family: 'Times New Roman', serif; font-weight: bold; font-size: ${titleFontSize}px; text-anchor: middle; letter-spacing: 2px; }
          .body { fill: white; font-family: 'Times New Roman', serif; font-size: ${bodyFontSize}px; text-anchor: middle; }
          .footer { fill: rgba(255,255,255,0.8); font-family: sans-serif; font-size: 16px; text-anchor: middle; letter-spacing: 1px; }
        </style>
        
        <!-- Outer Border -->
        <rect x="30" y="30" width="540" height="540" rx="0" ry="0" fill="none" stroke="#FFD700" stroke-width="4" />
        <rect x="45" y="45" width="510" height="510" rx="0" ry="0" fill="none" stroke="white" stroke-width="1" stroke-opacity="0.5" />

        <!-- Title -->
        <text x="300" y="140" class="title">${title}</text>
        
        <!-- Separator -->
        <line x1="200" y1="160" x2="400" y2="160" stroke="#FFD700" stroke-width="2" />
    `;

        // Add Story Lines
        const lines = wrapText(finalStory, 28); // Tighter wrap for serif font
        lines.forEach((line, index) => {
            if (index < 8) {
                textSvgContent += `<text x="300" y="${startY + (index * lineHeight)}" class="body">${line}</text>`;
            }
        });

        // Footer
        textSvgContent += `
        <text x="300" y="530" class="footer">#KelloggsSuperMom</text>
      </svg>
    `;

        const textBuffer = Buffer.from(textSvgContent);

        // 3. Composite
        // Create base red canvas
        await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 246, g: 9, b: 69, alpha: 1 } // Kellogg's Red #F60945
            }
        })
            .composite([
                { input: imageBuffer, left: 0, top: 0 }, // Image on Left
                { input: textBuffer, left: 600, top: 0 } // Text on Right
            ])
            .jpeg({ quality: 80, mozjpeg: true }) // Compress output
            .toFile(outputPath);

        console.log(`✅ Greeting Card Generated: ${outputPath}`);
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
