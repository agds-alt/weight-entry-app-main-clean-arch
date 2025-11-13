/**
 * Diagnostic Script: Check Username Case Sensitivity Issue
 *
 * This script checks if there are users with mixed-case usernames in the database
 * that would fail login due to the .toLowerCase() in auth.service.js
 */

require('dotenv').config();
const { supabase } = require('../src/config/database');

async function checkUsernameCases() {
    console.log('🔍 DIAGNOSTIC: Username Case Sensitivity Check\n');
    console.log('='.repeat(70));

    try {
        // Fetch all users
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, full_name, role, is_active')
            .order('id');

        if (error) {
            throw error;
        }

        if (!users || users.length === 0) {
            console.log('❌ No users found in database');
            return;
        }

        console.log(`\n✅ Found ${users.length} users in database\n`);

        // Analyze each username
        const problematicUsers = [];
        const okUsers = [];

        users.forEach(user => {
            const hasUppercase = /[A-Z]/.test(user.username);
            const hasLowercase = /[a-z]/.test(user.username);
            const isAllLowercase = user.username === user.username.toLowerCase();

            const analysis = {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                is_active: user.is_active,
                hasUppercase,
                hasLowercase,
                isAllLowercase,
                lowercaseVersion: user.username.toLowerCase(),
                willFailLogin: !isAllLowercase
            };

            if (!isAllLowercase) {
                problematicUsers.push(analysis);
            } else {
                okUsers.push(analysis);
            }
        });

        // Display results
        console.log('📊 ANALYSIS RESULTS\n');
        console.log('='.repeat(70));

        if (problematicUsers.length > 0) {
            console.log(`\n❌ PROBLEMATIC USERS (${problematicUsers.length}) - CANNOT LOGIN:`);
            console.log('-'.repeat(70));
            problematicUsers.forEach(user => {
                console.log(`  ID: ${user.id}`);
                console.log(`  Username (DB): "${user.username}"`);
                console.log(`  Username (Query): "${user.lowercaseVersion}" ← auth.service.js converts to this`);
                console.log(`  Full Name: ${user.full_name || 'N/A'}`);
                console.log(`  Role: ${user.role}`);
                console.log(`  Status: ${user.is_active ? 'Active' : 'Inactive'}`);
                console.log(`  ❗ Problem: DB has "${user.username}" but query searches for "${user.lowercaseVersion}"`);
                console.log('');
            });
        }

        if (okUsers.length > 0) {
            console.log(`\n✅ OK USERS (${okUsers.length}) - CAN LOGIN:`);
            console.log('-'.repeat(70));
            okUsers.forEach(user => {
                console.log(`  ID: ${user.id} | Username: "${user.username}" | Role: ${user.role}`);
            });
            console.log('');
        }

        // Root cause analysis
        console.log('\n🔍 ROOT CAUSE ANALYSIS\n');
        console.log('='.repeat(70));
        console.log('\n📍 Code Flow (auth.service.js:68):');
        console.log('   1. User types: "Dani"');
        console.log('   2. Code converts: username.toLowerCase() → "dani"');
        console.log('   3. Query: .eq(\'username\', \'dani\') ← CASE-SENSITIVE!');
        console.log('   4. Database has: "Dani" ← NOT MATCH!');
        console.log('   5. Result: "Username atau password salah"\n');

        console.log('📍 Why "agus" works:');
        console.log('   - Database has: "agus" (already lowercase)');
        console.log('   - Code converts: "agus".toLowerCase() → "agus"');
        console.log('   - Query matches: "agus" === "agus" ✅\n');

        // Solution comparison
        console.log('\n💡 SOLUTION OPTIONS\n');
        console.log('='.repeat(70));
        console.log('\n❌ WRONG APPROACH (dari analisa sebelumnya):');
        console.log('   - UPDATE users SET username = LOWER(username)');
        console.log('   - Problem: Modifies existing data permanently');
        console.log('   - Problem: May break other references/logs\n');

        console.log('✅ CORRECT APPROACH:');
        console.log('   Option 1: Case-Insensitive Query');
        console.log('   - Use: .ilike() or LOWER() in SQL');
        console.log('   - Benefit: No data modification needed');
        console.log('   - Benefit: Works with existing usernames\n');

        console.log('   Option 2: Case-Insensitive Index');
        console.log('   - CREATE INDEX idx_username_lower ON users(LOWER(username))');
        console.log('   - Query: WHERE LOWER(username) = LOWER(input)');
        console.log('   - Benefit: Better performance\n');

        console.log('   Option 3: Remove .toLowerCase() from auth code');
        console.log('   - Remove line 68: username.toLowerCase()');
        console.log('   - Make usernames truly case-sensitive');
        console.log('   - Problem: "Dani" ≠ "dani" (different accounts)\n');

        // Recommendation
        console.log('\n🎯 RECOMMENDED SOLUTION\n');
        console.log('='.repeat(70));
        console.log('\n✅ Use Case-Insensitive Query (Option 1)\n');
        console.log('   Modify: src/repositories/user.repository.js');
        console.log('   Change: .eq(\'username\', username)');
        console.log('   To: .ilike(\'username\', username)\n');
        console.log('   OR use raw SQL with LOWER():\n');
        console.log('   WHERE LOWER(username) = LOWER($1)\n');

        // Summary
        console.log('\n📋 SUMMARY\n');
        console.log('='.repeat(70));
        console.log(`   Total Users: ${users.length}`);
        console.log(`   ❌ Cannot Login: ${problematicUsers.length}`);
        console.log(`   ✅ Can Login: ${okUsers.length}`);

        if (problematicUsers.length > 0) {
            console.log('\n   Affected Users:');
            problematicUsers.forEach(user => {
                console.log(`   - ${user.username}`);
            });
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ Diagnostic complete!\n');

        // Return results for potential automation
        return {
            total: users.length,
            problematic: problematicUsers,
            ok: okUsers,
            rootCause: 'Case-sensitive query with lowercase conversion',
            recommendation: 'Use case-insensitive query (.ilike or LOWER())'
        };

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\n💡 Make sure:');
        console.error('   1. .env file exists with correct SUPABASE_URL and SUPABASE_SERVICE_KEY');
        console.error('   2. Database is accessible');
        console.error('   3. users table exists\n');
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    checkUsernameCases()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { checkUsernameCases };
