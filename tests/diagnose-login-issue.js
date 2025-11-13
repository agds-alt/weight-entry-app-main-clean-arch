/**
 * DIAGNOSTIC SCRIPT - Login Issue Debugger
 *
 * This script helps diagnose why users cannot login
 * Run with: node tests/diagnose-login-issue.js
 */

const bcrypt = require('bcryptjs');
const { supabase } = require('../src/config/database');

async function diagnoseLOGIN() {
    console.log('\n🔍 DIAGNOSING LOGIN ISSUE...\n');
    console.log('='.repeat(60));

    try {
        // STEP 1: Check database connection
        console.log('\n📡 STEP 1: Checking database connection...');
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        if (testError) {
            console.error('❌ Database connection FAILED:');
            console.error('   Error:', testError.message);
            console.error('\n🔧 FIX: Check your .env file:');
            console.error('   - SUPABASE_URL is correct');
            console.error('   - SUPABASE_SERVICE_KEY is correct');
            return;
        }

        console.log('✅ Database connection OK');
        console.log(`   Total users in database: ${testData || 0}`);

        // STEP 2: Check if users table has data
        console.log('\n📊 STEP 2: Checking users table...');
        const { data: users, error: usersError, count } = await supabase
            .from('users')
            .select('id, username, email, is_active, created_at, password', { count: 'exact' })
            .limit(5);

        if (usersError) {
            console.error('❌ Error reading users table:');
            console.error('   Error:', usersError.message);
            return;
        }

        if (!users || users.length === 0) {
            console.error('❌ Users table is EMPTY!');
            console.error('\n🔧 FIX: Create users first:');
            console.error('   - Run: node tests/setup-admin.js');
            console.error('   - Or register a new user via /api/auth/register');
            return;
        }

        console.log(`✅ Found ${count} users in table`);
        console.log('\n   Sample users:');
        users.forEach((user, idx) => {
            console.log(`   ${idx + 1}. Username: ${user.username || 'NULL'}`);
            console.log(`      Email: ${user.email || 'NULL'}`);
            console.log(`      Active: ${user.is_active}`);
            console.log(`      Password set: ${user.password ? 'YES' : 'NO'}`);
            if (user.password) {
                console.log(`      Password format: ${user.password.substring(0, 7)}... (${user.password.startsWith('$2') ? 'bcrypt ✅' : 'WRONG FORMAT ❌'})`);
            }
            console.log('');
        });

        // STEP 3: Check for common issues
        console.log('🔍 STEP 3: Checking for common issues...\n');

        // Issue #1: NULL usernames
        const { count: nullUsernameCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .is('username', null);

        if (nullUsernameCount > 0) {
            console.warn(`⚠️  WARNING: ${nullUsernameCount} users have NULL username!`);
            console.warn('   🔧 FIX: Run migration to generate usernames from email');
        } else {
            console.log('✅ All users have usernames');
        }

        // Issue #2: NULL passwords
        const { count: nullPasswordCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .is('password', null);

        if (nullPasswordCount > 0) {
            console.warn(`⚠️  WARNING: ${nullPasswordCount} users have NULL password!`);
            console.warn('   🔧 FIX: Users need to set passwords');
        } else {
            console.log('✅ All users have passwords');
        }

        // Issue #3: Inactive users
        const { count: inactiveCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', false);

        if (inactiveCount > 0) {
            console.warn(`⚠️  WARNING: ${inactiveCount} users are INACTIVE`);
            console.warn('   🔧 FIX: Activate users or check is_active column');
        } else {
            console.log('✅ All users are active');
        }

        // Issue #4: Password format check
        const { data: sampleUser } = await supabase
            .from('users')
            .select('username, password')
            .not('password', 'is', null)
            .limit(1)
            .single();

        if (sampleUser && sampleUser.password) {
            if (!sampleUser.password.startsWith('$2b$') && !sampleUser.password.startsWith('$2a$')) {
                console.error('❌ CRITICAL: Passwords are NOT bcrypt hashed!');
                console.error(`   Password format: ${sampleUser.password.substring(0, 20)}...`);
                console.error('\n🔧 FIX: Passwords must be bcrypt hashed!');
                console.error('   - Generate hash: node -e "const bcrypt=require(\'bcryptjs\'); bcrypt.hash(\'password\', 10).then(console.log)"');
                console.error('   - Update database with hashed passwords');
            } else {
                console.log('✅ Passwords are properly bcrypt hashed');
            }
        }

        // STEP 4: Test actual login flow
        console.log('\n🧪 STEP 4: Testing login flow...\n');

        if (users && users.length > 0) {
            const testUser = users[0];

            if (!testUser.username) {
                console.warn('⚠️  Cannot test login - first user has NULL username');
            } else if (!testUser.password) {
                console.warn('⚠️  Cannot test login - first user has NULL password');
            } else {
                console.log(`   Testing with username: "${testUser.username}"`);

                // Try to find user (same as login does)
                const { data: foundUser, error: findError } = await supabase
                    .from('users')
                    .select('id, username, password, email, full_name, role, is_active')
                    .eq('username', testUser.username.toLowerCase())
                    .single();

                if (findError) {
                    console.error('❌ User lookup FAILED:');
                    console.error('   Error:', findError.message);
                    if (findError.code === 'PGRST116') {
                        console.error('   🔧 FIX: Username not found - check case sensitivity');
                    }
                } else if (!foundUser) {
                    console.error('❌ User NOT FOUND with username:', testUser.username.toLowerCase());
                    console.error('   🔧 FIX: Check username case - try both uppercase and lowercase');
                } else {
                    console.log('✅ User lookup successful');
                    console.log(`   Found user: ${foundUser.username} (${foundUser.email})`);
                    console.log(`   Active: ${foundUser.is_active}`);
                    console.log(`   Role: ${foundUser.role}`);

                    if (!foundUser.is_active) {
                        console.error('❌ User is INACTIVE!');
                        console.error('   🔧 FIX: Activate user with: UPDATE users SET is_active = true WHERE id = ' + foundUser.id);
                    }

                    // Test password verification
                    console.log('\n   Testing password verification...');
                    console.log('   (We cannot test actual password without knowing it,');
                    console.log('    but we can verify the hash format)');

                    try {
                        // Try comparing with a dummy password to ensure bcrypt works
                        const dummyTest = await bcrypt.compare('dummy', foundUser.password);
                        console.log('✅ Bcrypt password verification works');
                    } catch (bcryptError) {
                        console.error('❌ Bcrypt verification FAILED:');
                        console.error('   Error:', bcryptError.message);
                        console.error('   🔧 FIX: Password hash is invalid');
                    }
                }
            }
        }

        // STEP 5: Summary and recommendations
        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY & RECOMMENDATIONS\n');

        console.log('To test login, try these credentials:');
        if (users && users.length > 0 && users[0].username) {
            console.log(`   Username: ${users[0].username}`);
            console.log(`   Password: [use the password you set]`);
        }

        console.log('\nIf you don\'t know the password:');
        console.log('1. Generate new bcrypt hash:');
        console.log('   node -e "const bcrypt=require(\'bcryptjs\'); bcrypt.hash(\'admin123\', 10).then(console.log)"');
        console.log('\n2. Update user password in Supabase:');
        console.log('   UPDATE users SET password = \'[hash from step 1]\' WHERE username = \'admin\'');
        console.log('\n3. Try logging in with username "admin" and password "admin123"');

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n❌ UNEXPECTED ERROR:');
        console.error(error);
    }

    process.exit(0);
}

// Run diagnosis
diagnoseLOGIN();
