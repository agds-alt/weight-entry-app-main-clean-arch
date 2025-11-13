/**
 * USERNAME CONFLICT RESOLVER
 *
 * This script handles username normalization with conflict detection and resolution
 * Run with: node fix-username-conflicts.js
 */

const { supabase } = require('./src/config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function normalizeUsername(username) {
    if (!username) return username;
    return username.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function fixUsernameConflicts() {
    console.log('\n🔧 USERNAME CONFLICT RESOLVER\n');
    console.log('='.repeat(70));

    try {
        // Step 1: Fetch all users
        console.log('\n📊 Step 1: Fetching all users...\n');

        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id, username, full_name, email, is_active, created_at');

        if (fetchError) {
            console.error('❌ Error fetching users:', fetchError);
            rl.close();
            process.exit(1);
        }

        if (!users || users.length === 0) {
            console.log('✅ No users found');
            rl.close();
            process.exit(0);
        }

        console.log(`Found ${users.length} users\n`);

        // Step 2: Analyze for conflicts
        console.log('🔍 Step 2: Analyzing usernames for conflicts...\n');

        const normalizedMap = new Map(); // normalized -> [original users]
        const usersNeedingFix = [];

        for (const user of users) {
            const normalized = await normalizeUsername(user.username);
            const needsFix = user.username !== normalized;

            if (!normalizedMap.has(normalized)) {
                normalizedMap.set(normalized, []);
            }
            normalizedMap.get(normalized).push(user);

            if (needsFix) {
                usersNeedingFix.push({
                    ...user,
                    normalized: normalized
                });
            }
        }

        // Find conflicts
        const conflicts = [];
        for (const [normalized, userList] of normalizedMap.entries()) {
            if (userList.length > 1) {
                conflicts.push({
                    normalized: normalized,
                    users: userList
                });
            }
        }

        // Step 3: Show users needing normalization
        if (usersNeedingFix.length === 0) {
            console.log('✅ All usernames are already normalized!\n');
            console.log('Current usernames:');
            users.forEach(u => {
                console.log(`  - "${u.username}" (${u.full_name || 'no name'})`);
            });
            rl.close();
            process.exit(0);
        }

        console.log(`Found ${usersNeedingFix.length} users needing normalization:\n`);
        usersNeedingFix.forEach((user, idx) => {
            console.log(`${idx + 1}. ID ${user.id}: "${user.username}" → "${user.normalized}"`);
            console.log(`   Name: ${user.full_name || 'N/A'}, Email: ${user.email || 'N/A'}`);
        });

        // Step 4: Handle conflicts
        console.log('\n🚨 Step 3: Checking for conflicts...\n');

        if (conflicts.length === 0) {
            console.log('✅ No conflicts detected - safe to proceed!\n');

            const answer = await question('Apply normalization to all users? (yes/no): ');

            if (answer.toLowerCase() !== 'yes') {
                console.log('❌ Operation cancelled');
                rl.close();
                process.exit(0);
            }

            // Apply fixes
            console.log('\n🔧 Applying normalization...\n');
            let successCount = 0;

            for (const user of usersNeedingFix) {
                try {
                    const { error } = await supabase
                        .from('users')
                        .update({ username: user.normalized })
                        .eq('id', user.id);

                    if (error) {
                        console.error(`❌ Failed to update user ${user.id}:`, error.message);
                    } else {
                        console.log(`✅ Updated: "${user.username}" → "${user.normalized}"`);
                        successCount++;
                    }
                } catch (err) {
                    console.error(`❌ Error updating user ${user.id}:`, err.message);
                }
            }

            console.log(`\n✅ Successfully updated ${successCount}/${usersNeedingFix.length} users`);
            rl.close();
            process.exit(0);
        }

        // Handle conflicts
        console.log(`⚠️  Found ${conflicts.length} conflict(s):\n`);

        for (const conflict of conflicts) {
            console.log(`\nConflict for username "${conflict.normalized}":`);
            conflict.users.forEach((user, idx) => {
                console.log(`  ${idx + 1}. ID ${user.id}: "${user.username}"`);
                console.log(`     Name: ${user.full_name || 'N/A'}`);
                console.log(`     Email: ${user.email || 'N/A'}`);
                console.log(`     Created: ${user.created_at}`);
                console.log(`     Active: ${user.is_active}`);
            });
        }

        console.log('\n📋 CONFLICT RESOLUTION OPTIONS:\n');
        console.log('1. MANUAL - I will provide SQL commands to rename conflicting users');
        console.log('2. AUTO - Automatically append numbers to duplicates (e.g., dani, dani2, dani3)');
        console.log('3. SKIP - Skip conflicting users, only normalize non-conflicting ones');
        console.log('4. CANCEL - Exit without making changes\n');

        const choice = await question('Choose an option (1-4): ');

        switch (choice) {
            case '1':
                // Manual resolution
                console.log('\n📝 MANUAL RESOLUTION STEPS:\n');
                console.log('Run these SQL commands in Supabase to resolve conflicts:\n');

                for (const conflict of conflicts) {
                    console.log(`-- Conflict: "${conflict.normalized}"`);
                    conflict.users.forEach((user, idx) => {
                        if (idx > 0) { // Keep first one, rename others
                            const suggestedName = `${conflict.normalized}${idx + 1}`;
                            console.log(`UPDATE users SET username = '${suggestedName}' WHERE id = ${user.id}; -- ${user.full_name || user.email}`);
                        }
                    });
                    console.log('');
                }

                console.log('After running these commands, run this script again to normalize remaining users.');
                break;

            case '2':
                // Auto resolution
                console.log('\n🔧 AUTO-RESOLVING conflicts...\n');

                for (const conflict of conflicts) {
                    for (let i = 1; i < conflict.users.length; i++) {
                        const user = conflict.users[i];
                        const newUsername = `${conflict.normalized}${i + 1}`;

                        try {
                            const { error } = await supabase
                                .from('users')
                                .update({ username: newUsername })
                                .eq('id', user.id);

                            if (error) {
                                console.error(`❌ Failed to rename user ${user.id}:`, error.message);
                            } else {
                                console.log(`✅ Renamed: "${user.username}" → "${newUsername}"`);
                            }
                        } catch (err) {
                            console.error(`❌ Error renaming user ${user.id}:`, err.message);
                        }
                    }
                }

                console.log('\n✅ Conflicts resolved! Run the script again to normalize all users.');
                break;

            case '3':
                // Skip conflicts
                console.log('\n🔧 Normalizing non-conflicting users only...\n');

                const conflictUserIds = new Set();
                conflicts.forEach(c => c.users.forEach(u => conflictUserIds.add(u.id)));

                const safeUsers = usersNeedingFix.filter(u => !conflictUserIds.has(u.id));

                let successCount = 0;
                for (const user of safeUsers) {
                    try {
                        const { error } = await supabase
                            .from('users')
                            .update({ username: user.normalized })
                            .eq('id', user.id);

                        if (error) {
                            console.error(`❌ Failed to update user ${user.id}:`, error.message);
                        } else {
                            console.log(`✅ Updated: "${user.username}" → "${user.normalized}"`);
                            successCount++;
                        }
                    } catch (err) {
                        console.error(`❌ Error updating user ${user.id}:`, err.message);
                    }
                }

                console.log(`\n✅ Updated ${successCount} users (skipped ${conflictUserIds.size} conflicting users)`);
                break;

            case '4':
                console.log('\n❌ Operation cancelled');
                break;

            default:
                console.log('\n❌ Invalid option');
        }

    } catch (error) {
        console.error('\n❌ UNEXPECTED ERROR:', error);
    }

    rl.close();
    process.exit(0);
}

// Run the script
fixUsernameConflicts();
