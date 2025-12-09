#!/usr/bin/env node

console.log('\n🔍 Checking Supabase Configuration...\n');

// Check if .env.local exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file NOT FOUND!\n');
    console.log('📝 You need to create: schoolable_dashboard/.env.local\n');
    console.log('Add these lines:\n');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n');
    process.exit(1);
}

console.log('✅ .env.local file exists\n');

// Read and check environment variables
const envContent = fs.readFileSync(envPath, 'utf-8');
const hasUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
const hasKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!hasUrl) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL is missing!\n');
}

if (!hasKey) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing!\n');
}

if (hasUrl && hasKey) {
    console.log('✅ Both Supabase credentials are present\n');

    // Extract URL to check format
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1].trim();
        console.log(`📍 Supabase URL: ${url}\n`);

        if (url.includes('your-project') || url.includes('example') || url.includes('localhost')) {
            console.log('⚠️  WARNING: URL looks like a placeholder!\n');
            console.log('Get your real URL from: https://supabase.com/dashboard\n');
        } else if (url.includes('.supabase.co')) {
            console.log('✅ URL format looks correct\n');
            console.log('🔄 Testing connection to Supabase...\n');

            // Test connection
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    console.log('✅ Supabase is reachable!\n');
                    console.log('🎉 Configuration looks good!\n');
                    console.log('Next steps:');
                    console.log('1. Restart your dev server: pnpm dev');
                    console.log('2. Create admin user in Supabase');
                    console.log('3. Try logging in!\n');
                })
                .catch(err => {
                    console.log('❌ Cannot reach Supabase!\n');
                    console.log('Error:', err.message, '\n');
                    console.log('Possible issues:');
                    console.log('- Wrong URL');
                    console.log('- Supabase project doesn\'t exist');
                    console.log('- Network/firewall blocking connection\n');
                });
        } else {
            console.log('❌ URL format doesn\'t look right\n');
            console.log('Should be: https://xxxxx.supabase.co\n');
        }
    }
} else {
    console.log('\n📖 To get your credentials:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select (or create) your project');
    console.log('3. Settings → API');
    console.log('4. Copy "Project URL" and "anon public" key\n');
}
