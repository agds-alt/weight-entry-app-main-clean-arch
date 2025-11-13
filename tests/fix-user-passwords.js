/**
 * FIX USER PASSWORDS
 *
 * This script helps fix user passwords if they're not properly hashed
 * or if users need password reset
 *
 * Usage:
 *   node tests/fix-user-passwords.js                    # Interactive mode
 *   node tests/fix-user-passwords.js admin admin123     # Set specific user password
 */

const bcrypt = require('bcryptjs');
const { supabase } = require('../src/config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function fixPasswords() {
    console.log('\n🔧 FIX USER PASSWORDS\n');
    console.log('='.repeat(60));

    try {
        // Get username from args or prompt
        let username = process.argv[2];
        let password = process.argv[3];

        if (!username) {
            // List existing users
            console.log('\n📋 Existing users:\n');
            const { data: users, error } = await supabase
                .from('users')
                .select('username, email, role, is_active')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching users:', error.message);
                process.exit(1);
            }

            if (!users || users.length === 0) {
                console.log('No users found in database!');
                console.log('\nCreate a new user first with:');
                console.log('  POST /api/auth/register');
                process.exit(0);
            }

            users.forEach((user, idx) => {
                console.log(`${idx + 1}. Username: ${user.username || 'NULL'}`);
                console.log(`   Email: ${user.email || 'NULL'}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
                console.log('');
            });

            username = await question('\nEnter username to fix password for: ');
            if (!username) {
                console.log('No username provided. Exiting.');
                rl.close();
                process.exit(0);
            }
        }

        if (!password) {
            password = await question(`Enter new password for "${username}": `);
            if (!password) {
                console.log('No password provided. Exiting.');
                rl.close();
                process.exit(0);
            }
        }

        // Verify user exists
        console.log(`\nChecking if user "${username}" exists...`);
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('id, username, email, role')
            .eq('username', username.toLowerCase())
            .single();

        if (findError || !user) {
            console.error(`❌ User "${username}" not found!`);
            console.error('Error:', findError?.message);
            rl.close();
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.username} (${user.email})`);

        // Hash the password
        console.log('\n🔐 Hashing password with bcrypt...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed successfully');
        console.log(`   Hash: ${hashedPassword.substring(0, 29)}...`);

        // Update password in database
        console.log('\n💾 Updating password in database...');
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('❌ Failed to update password!');
            console.error('Error:', updateError.message);
            rl.close();
            process.exit(1);
        }

        console.log('✅ Password updated successfully!');

        // Verify the password works
        console.log('\n🧪 Testing password...');
        const { data: updatedUser, error: verifyError } = await supabase
            .from('users')
            .select('password')
            .eq('id', user.id)
            .single();

        if (verifyError) {
            console.error('❌ Failed to verify password update');
        } else {
            const isValid = await bcrypt.compare(password, updatedUser.password);
            if (isValid) {
                console.log('✅ Password verification successful!');
            } else {
                console.error('❌ Password verification FAILED!');
                console.error('   The password was updated but verification failed.');
                console.error('   This should not happen. Check your database.');
            }
        }

        // Make sure user is active
        console.log('\n🔄 Ensuring user is active...');
        const { error: activateError } = await supabase
            .from('users')
            .update({ is_active: true })
            .eq('id', user.id);

        if (activateError) {
            console.warn('⚠️  Could not activate user:', activateError.message);
        } else {
            console.log('✅ User is active');
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 SUCCESS! You can now login with:\n');
        console.log(`   Username: ${user.username}`);
        console.log(`   Password: ${password}`);
        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n❌ UNEXPECTED ERROR:');
        console.error(error);
    }

    rl.close();
    process.exit(0);
}

// Run the fix
fixPasswords();
