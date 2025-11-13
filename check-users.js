// Check usernames in database
const { supabase } = require('./src/config/database');

async function checkUsers() {
    try {
        console.log('Fetching all users from database...\n');

        const { data, error } = await supabase
            .from('users')
            .select('id, username, full_name, is_active')
            .order('username');

        if (error) {
            console.error('Error fetching users:', error);
            return;
        }

        if (!data || data.length === 0) {
            console.log('No users found in database');
            return;
        }

        console.log(`Found ${data.length} users:\n`);
        console.log('ID  | Username (length) | Full Name | Active');
        console.log('-'.repeat(70));

        data.forEach(user => {
            const usernameDisplay = `"${user.username}" (${user.username.length})`;
            const hasSpaces = user.username.includes(' ') ? '⚠️ HAS SPACES' : '';
            console.log(`${user.id} | ${usernameDisplay.padEnd(25)} | ${(user.full_name || '').padEnd(20)} | ${user.is_active} ${hasSpaces}`);
        });

        console.log('\n--- Checking for problematic usernames ---');
        const problematicUsers = data.filter(u =>
            u.username.includes(' ') ||
            u.username !== u.username.toLowerCase() ||
            u.username !== u.username.trim()
        );

        if (problematicUsers.length > 0) {
            console.log('\n⚠️ Found users with potential issues:');
            problematicUsers.forEach(user => {
                console.log(`\nUser: "${user.username}"`);
                console.log(`  - Has spaces: ${user.username.includes(' ')}`);
                console.log(`  - Has uppercase: ${user.username !== user.username.toLowerCase()}`);
                console.log(`  - Has extra whitespace: ${user.username !== user.username.trim()}`);
                console.log(`  - Lowercase version: "${user.username.toLowerCase()}"`);
            });
        } else {
            console.log('✅ All usernames are properly formatted');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkUsers();
