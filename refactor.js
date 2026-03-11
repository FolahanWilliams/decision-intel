const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));

let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let hasChanges = false;

    // Check if file uses clerk
    if (content.includes('@clerk/nextjs')) {
        // Replace imports
        content = content.replace(
            /(?:import\s+\{.*auth.*\}\s+from\s+['"]@clerk\/nextjs\/?(?:server)?['"];?)|(?:import\s+auth\s+from\s+['"]@clerk\/nextjs\/?(?:server)?['"];?)/g,
            "import { createClient } from '@/utils/supabase/server';"
        );

        // Remove other clerk imports
        content = content.replace(/import\s+.*from\s+['"]@clerk\/nextjs.*['"];?/g, '');

        // Replace `const { userId } = await auth();` or `const { userId } = auth();`
        // We will insert the Supabase initialization right where `auth()` was used.
        content = content.replace(
            /const\s+\{\s*userId\s*\}\s*=\s*(?:await\s+)?auth\(\)\s*;/g,
            `const supabase = await createClient();\n        const { data: { user } } = await supabase.auth.getUser();\n        const userId = user?.id;`
        );
        
        content = content.replace(
            /let\s+\{\s*userId\s*\}\s*=\s*(?:await\s+)?auth\(\)\s*;/g,
            `const supabase = await createClient();\n        const { data: { user } } = await supabase.auth.getUser();\n        let userId = user?.id;`
        );

        // If auth() is used directly like `auth().userId`
        content = content.replace(
            /(?:await\s+)?auth\(\)\.userId/g,
            `(await (await createClient()).auth.getUser()).data.user?.id`
        );

        // If it's used inside a component without `await` (Clerk's auth() can be sync in some versions, but supabase is async)
        // This regex won't cover every edge case, but covers the API routes which are async.
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated auth logic in: ${file}`);
        hasChanges = true;
        modifiedCount++;
    }
}

console.log(`\nModified ${modifiedCount} files.`);
