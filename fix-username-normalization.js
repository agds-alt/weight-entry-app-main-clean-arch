/**
 * USERNAME NORMALIZATION SCRIPT
 *
 * This script fixes username case sensitivity and whitespace issues
 * Run with: node fix-username-normalization.js
 *
 * The issue: Some usernames may have:
 * - Uppercase letters (e.g., "Faizal Al" instead of "faizal al")
 * - Leading/trailing spaces (e.g., " faizal al " instead of "faizal al")
 * - Multiple spaces (e.g., "faizal  al" instead of "faizal al")
 *
 * The fix: Normalize all usernames to:
 * - Lowercase
 * - Trimmed (no leading/trailing spaces)
 * - Single spaces between words
 */

const { supabase } = require('./src/config/database');

async function normalizeUsername(username) {
    if (!username) return username;

    // Convert to lowercase, trim, and replace multiple spaces with single space
    return username
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

async function fixUsernameNormalization() {
    console.log('\n🔧 USERNAME NORMALIZATION SCRIPT\n');
    console.log('='.repeat(70));

    try {
        // Step 1: Fetch all users
        console.log('\n📊 Step 1: Fetching all users from database...\n');

        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id, username, full_name, is_active');

        if (fetchError) {
            console.error('❌ Error fetching users:', fetchError);
            return;
        }

        if (!users || users.length === 0) {
            console.log('✅ No users found in database');
            return;
        }

        console.log(`Found ${users.length} users\n`);

        // Step 2: Check which users need normalization
        console.log('📋 Step 2: Analyzing usernames...\n');

        const usersNeedingFix = [];

        users.forEach(user => {
            const normalized = normalizeUsername(user.username);
            const needsFix = user.username !== normalized;

            if (needsFix) {
                usersNeedingFix.push({
                    id: user.id,
                    original: user.username,
                    normalized: normalized,
                    full_name: user.full_name
                });
            }
        });

        if (usersNeedingFix.length === 0) {
            console.log('✅ All usernames are already normalized!');
            console.log('\nCurrent usernames:');
            users.forEach(u => {
                console.log(`  - "${u.username}" (${u.full_name || 'no name'})`);
            });
            return;
        }

        console.log(`⚠️  Found ${usersNeedingFix.length} users needing normalization:\n`);
        usersNeedingFix.forEach((user, idx) => {
            console.log(`${idx + 1}. User ID ${user.id}:`);
            console.log(`   Original:   "${user.original}"`);
            console.log(`   Normalized: "${user.normalized}"`);
            console.log(`   Full Name:  ${user.full_name || 'N/A'}`);
            console.log('');
        });

        // Step 3: Check for potential username conflicts
        console.log('🔍 Step 3: Checking for potential conflicts...\n');

        const normalizedUsernames = usersNeedingFix.map(u => u.normalized);
        const existingUsernames = users.map(u => normalizeUsername(u.username));

        const conflicts = [];
        usersNeedingFix.forEach(user => {
            const count = existingUsernames.filter(u => u === user.normalized).length;
            if (count > 1) {
                conflicts.push({
                    username: user.normalized,
                    count: count
                });
            }
        });

        if (conflicts.length > 0) {
            console.error('❌ CONFLICT DETECTED!');
            console.error('   After normalization, these usernames would be duplicates:');
            conflicts.forEach(c => {
                console.error(`   - "${c.username}" would appear ${c.count} times`);
            });
            console.error('\n🔧 FIX: Manually rename conflicting users before running this script');
            return;
        }

        console.log('✅ No conflicts detected\n');

        // Step 4: Apply fixes
        console.log('🔧 Step 4: Applying normalization...\n');

        let successCount = 0;
        let errorCount = 0;

        for (const user of usersNeedingFix) {
            try {
                const { error } = await supabase
                    .from('users')
                    .update({ username: user.normalized })
                    .eq('id', user.id);

                if (error) {
                    console.error(`❌ Failed to update user ${user.id}:`, error.message);
                    errorCount++;
                } else {
                    console.log(`✅ Updated: "${user.original}" → "${user.normalized}"`);
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ Error updating user ${user.id}:`, err.message);
                errorCount++;
            }
        }

        // Step 5: Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY\n');
        console.log(`Total users processed: ${usersNeedingFix.length}`);
        console.log(`✅ Successfully updated: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);

        if (successCount > 0) {
            console.log('\n✨ Username normalization completed!');
            console.log('\n📋 All users can now login with lowercase usernames');
            console.log('   Example: "Faizal Al" can login with "faizal al"');
        }

        console.log('\n' + '='.repeat(70));

    } catch (error) {
        console.error('\n❌ UNEXPECTED ERROR:', error);
    }

    process.exit(0);
}

// Run the script
fixUsernameNormalization();
