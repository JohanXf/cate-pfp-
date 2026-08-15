const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I will fix the `{` in `{           </div>        </aside>` which should not be there.
// Looking at the context, it should probably just be `           </div>        </aside>`.
code = code.replace(/\{\s*<\/div>\s*<\/aside>/, "            </div>\n        </aside>");

fs.writeFileSync('src/App.tsx', code);
