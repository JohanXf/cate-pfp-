const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove transparentBg and overlayBlend state
code = code.replace(/const \[transparentBg, setTransparentBg\] = useState\(false\);\n/, '');
code = code.replace(/const \[overlayBlend, setOverlayBlend\] = useState\(true\);\n/, '');

// Add showGuide state
code = code.replace(/const \[maskRadius, setMaskRadius\] = useState\(415\);.*?\n/, "const [maskRadius, setMaskRadius] = useState(415);\n  const [showGuide, setShowGuide] = useState(false);\n");

// 2. Remove transparentBg background drawing
code = code.replace(/if \(!transparentBg\) {\n\s*ctx\.fillStyle = '#FAF9F6';\n\s*ctx\.fillRect\(0, 0, canvas\.width, canvas\.height\);\n\s*}\n/, "ctx.fillStyle = '#FAF9F6';\n    ctx.fillRect(0, 0, canvas.width, canvas.height);\n");

// 3. Remove overlayBlend logic
code = code.replace(/if \(overlayBlend\) {\n\s*ctx\.globalCompositeOperation = 'screen';\n\s*}\n\s*/, "");

// 4. Update overlay scaling logic so it's independent of maskRadius
// Base diameter is 1080 (the canvas width is 1080 usually)
code = code.replace(/\/\/ Match the overlay exactly to the inner mask radius size, then scale by overlayScale\n\s*const dw = maskRadius \* 2 \* overlayScale;\n\s*const dh = maskRadius \* 2 \* overlayScale;\n/, "// Match the overlay to the canvas size, then scale by overlayScale\n      const dw = 1080 * overlayScale;\n      const dh = 1080 * overlayScale;\n");

// 5. Update useEffect dependency array
code = code.replace(/, transparentBg, overlayBlend/, "");

// 6. Change "Join the Pride" to "Guide" button
code = code.replace(/<button className="bg-\[#1A1A1A\] text-\[#FACC15\] px-6 py-3 rounded-full hover:bg-\[#FACC15\] hover:text-\[#1A1A1A\] transition-colors border-2 border-\[#1A1A1A\]">Join the Pride<\/button>/, `<button onClick={() => setShowGuide(true)} className="bg-[#1A1A1A] text-[#FACC15] px-6 py-3 rounded-full hover:bg-[#FACC15] hover:text-[#1A1A1A] transition-colors border-2 border-[#1A1A1A]">Guide</button>`);

// 7. Remove UI checkboxes for Transparent BG and Overlay Blend
code = code.replace(/\{overlayImage && \(\n\s*<label className="flex items-center gap-2 cursor-pointer group px-1">[\s\S]*?<\/label>\n\s*\)\}/, "");
code = code.replace(/\/\* Transparent BG Toggle \*\/[\s\S]*?<\/label>\n\s*<\/div>/, "");

fs.writeFileSync('src/App.tsx', code);
