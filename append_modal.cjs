const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const modalCode = `
      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#FAF9F6] border-4 border-[#1A1A1A] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_#1A1A1A]">
            <div className="p-6 md:p-10 flex flex-col gap-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">How to use Cate PFP Gen</h2>
                  <p className="text-sm font-bold opacity-60">Follow this guide to create your perfect profile picture.</p>
                </div>
                <button onClick={() => setShowGuide(false)} className="text-[#1A1A1A] hover:bg-[#FACC15] p-2 border-2 border-transparent hover:border-[#1A1A1A] transition-colors rounded-full">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              <div className="space-y-8 text-[#1A1A1A]">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-[#FACC15] border-2 border-[#1A1A1A] flex items-center justify-center font-black text-xl">1</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 uppercase tracking-wide">Remove Your Background</h3>
                    <p className="text-sm leading-relaxed">
                      Before uploading your photo here, it's best to remove its background so it blends perfectly with the coin. Go to <a href="https://www.remove.bg" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">remove.bg</a>, upload your photo, and download the transparent version.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-[#FACC15] border-2 border-[#1A1A1A] flex items-center justify-center font-black text-xl">2</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 uppercase tracking-wide">Upload Custom Photo</h3>
                    <p className="text-sm leading-relaxed">
                      Click the "Upload Custom Photo" button and select the transparent image you just downloaded.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-[#FACC15] border-2 border-[#1A1A1A] flex items-center justify-center font-black text-xl">3</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 uppercase tracking-wide">Use The Sliders</h3>
                    <div className="space-y-3 mt-3 text-sm">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-black/10 pb-3">
                        <span className="font-black w-40 shrink-0 bg-black/5 px-2 py-1 uppercase tracking-widest text-[10px]">Base Coin Zoom</span>
                        <span className="opacity-80">Adjusts the size of the gold coin background image.</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-black/10 pb-3">
                        <span className="font-black w-40 shrink-0 bg-black/5 px-2 py-1 uppercase tracking-widest text-[10px]">Overlay 'C' Zoom</span>
                        <span className="opacity-80">Adjusts the size of the black 'C' logo overlay completely independently.</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-black/10 pb-3">
                        <span className="font-black w-40 shrink-0 bg-black/5 px-2 py-1 uppercase tracking-widest text-[10px]">Coin Inner Size</span>
                        <span className="opacity-80">Controls the size of the invisible circular mask that crops your custom photo.</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-black/10 pb-3">
                        <span className="font-black w-40 shrink-0 bg-black/5 px-2 py-1 uppercase tracking-widest text-[10px]">Photo Zoom & Rotate</span>
                        <span className="opacity-80">Scales and rotates your custom photo. (You can also drag the photo directly on the canvas to move it).</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowGuide(false)} className="mt-4 w-full bg-[#1A1A1A] text-[#FACC15] px-6 py-4 font-black uppercase tracking-widest hover:bg-black transition-colors border-2 border-[#1A1A1A]">
                Got it, let's create
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/      <\/main>\n    <\/div>\n  \);\n\}/, modalCode + "\n      </main>\n    </div>\n  );\n}");

// ensure import X
if (!code.includes(' X ')) {
    code = code.replace(/import \{ Upload, Download, ZoomIn, ZoomOut, Move, RefreshCw, Image as ImageIcon, Check \} from 'lucide-react';/, "import { Upload, Download, ZoomIn, ZoomOut, Move, RefreshCw, Image as ImageIcon, Check, X } from 'lucide-react';");
}

fs.writeFileSync('src/App.tsx', code);
