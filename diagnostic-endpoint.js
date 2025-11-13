/**
 * TEMPORARY DIAGNOSTIC ENDPOINT
 * Add this to your server.js to check usernames
 *
 * This will help us see exactly how usernames are stored
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('./src/config/database');

// GET /api/diagnostic/usernames - List all usernames
router.get('/usernames', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, full_name, is_active')
            .order('username');

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: error.message
            });
        }

        // Analyze usernames for issues
        const analysis = data.map(user => ({
            id: user.id,
            username: user.username,
            usernameLength: user.username?.length || 0,
            full_name: user.full_name,
            is_active: user.is_active,
            issues: {
                hasSpaces: user.username?.includes(' ') || false,
                hasUppercase: user.username !== user.username?.toLowerCase(),
                hasLeadingSpace: user.username?.[0] === ' ',
                hasTrailingSpace: user.username?.[user.username.length - 1] === ' ',
                needsTrim: user.username !== user.username?.trim()
            }
        }));

        const problematic = analysis.filter(u =>
            u.issues.hasUppercase || u.issues.needsTrim
        );

        return res.json({
            success: true,
            total: data.length,
            users: analysis,
            problematic: problematic,
            summary: {
                totalUsers: data.length,
                usersWithSpaces: analysis.filter(u => u.issues.hasSpaces).length,
                usersWithUppercase: analysis.filter(u => u.issues.hasUppercase).length,
                usersNeedingTrim: analysis.filter(u => u.issues.needsTrim).length
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error',
            error: error.message
        });
    }
});

// GET /api/diagnostic/test-login/:username - Test if username can be found
router.get('/test-login/:username', async (req, res) => {
    try {
        const testUsername = req.params.username;

        console.log(`Testing login for: "${testUsername}"`);
        console.log(`Lowercase version: "${testUsername.toLowerCase()}"`);

        // Try exact match first
        const { data: exactMatch, error: exactError } = await supabase
            .from('users')
            .select('id, username, is_active')
            .eq('username', testUsername)
            .maybeSingle();

        // Try case-insensitive match (like the actual login does)
        const { data: iLikeMatch, error: iLikeError } = await supabase
            .from('users')
            .select('id, username, is_active')
            .ilike('username', testUsername)
            .maybeSingle();

        // Try lowercase exact match
        const { data: lowercaseMatch, error: lowercaseError } = await supabase
            .from('users')
            .select('id, username, is_active')
            .eq('username', testUsername.toLowerCase())
            .maybeSingle();

        return res.json({
            success: true,
            testUsername,
            testUsernameLowercase: testUsername.toLowerCase(),
            results: {
                exactMatch: exactMatch ? {
                    found: true,
                    username: exactMatch.username,
                    is_active: exactMatch.is_active
                } : { found: false, error: exactError?.message },

                iLikeMatch: iLikeMatch ? {
                    found: true,
                    username: iLikeMatch.username,
                    is_active: iLikeMatch.is_active
                } : { found: false, error: iLikeError?.message },

                lowercaseMatch: lowercaseMatch ? {
                    found: true,
                    username: lowercaseMatch.username,
                    is_active: lowercaseMatch.is_active
                } : { found: false, error: lowercaseError?.message }
            },
            recommendation: !iLikeMatch ?
                'User not found with ilike search - this is what login uses!' :
                iLikeMatch.is_active ?
                    'User found and active - check password' :
                    'User found but INACTIVE - activate the user'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error',
            error: error.message
        });
    }
});

module.exports = router;
