const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find the section to move
const startRegex = /\s*<div className=\{`space-y-6 transition-opacity duration-300 \$\{\(image \|\| bgImage \|\| overlayImage\) \? 'opacity-100' : 'opacity-40 pointer-events-none'\}`\}>\n\s*<label className="text-\[10px\] font-black uppercase tracking-widest block opacity-40">Step 02\. Frame Adjustments<\/label>/;
const endMarker = "</div>\n            </div>\n        </aside>"; // Wait, it's just `</div>` closing that div

const match = code.match(/(\s*<div className=\{`space-y-6 transition-opacity duration-300 \$\{\(image \|\| bgImage \|\| overlayImage\) \? 'opacity-100' : 'opacity-40 pointer-events-none'\}`\}>[\s\S]*?<\/label>\s*\{\/\* Base Coin Zoom Slider \*\/\}[\s\S]*?\{rotation\}°<\/span>\s*<\/div>\s*<input\s*type="range"\s*min="-180" max="180" step="1"\s*value=\{rotation\}\s*onChange=\{\(e\) => setRotation\(parseFloat\(e\.target\.value\)\)\}\s*className="w-full h-2 bg-\[#1A1A1A\] appearance-none cursor-pointer"\s*\/>\s*<\/div>\s*<\/div>)/);

if (!match) {
    console.error("Could not find sliders section");
    process.exit(1);
}

let slidersBlock = match[1];
// Remove from original position
code = code.replace(slidersBlock, "");

// Modify the block to be a horizontal grid layout suitable for underneath the canvas
slidersBlock = slidersBlock.replace(/className=\{`space-y-6 transition-opacity duration-300 /, "className={`w-full max-w-[800px] mt-8 z-10 transition-opacity duration-300 ");
slidersBlock = slidersBlock.replace(/<label className="text-\[10px\] font-black uppercase tracking-widest block opacity-40">Step 02\. Frame Adjustments<\/label>/, `<label className="text-[10px] font-black uppercase tracking-widest block opacity-40 mb-4 text-center">Step 02. Frame Adjustments</label>\n              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">`);
slidersBlock += "\n              </div>"; // close grid div

// Find insertion point
const insertPoint = /<p className="text-\[10px\] font-bold uppercase tracking-widest text-\[#1A1A1A\] mt-10 lg:mt-12 flex items-center gap-2 opacity-50">\s*<Move size=\{14\} \/> Drag image directly to position\s*<\/p>\s*<\/section>/;

code = code.replace(insertPoint, match => {
    return match.replace("</section>", "") + slidersBlock + "\n        </section>";
});

fs.writeFileSync('src/App.tsx', code);
console.log("Moved successfully.");
