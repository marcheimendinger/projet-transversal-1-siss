const express = require('express')
const router = express.Router()

const tools = require('../tools')
const database = require('../database')

// Get a list of the friends of a given user
// TODO : add a '/me' option
router.get('/view/:user_id', tools.isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.user_id
        const connectedUserId = req.user.id

        // Check if the given user is friend with the authenticated one
        const checkFriendship = await tools.isFriendWith(connectedUserId, userId)
        if (!checkFriendship) {
            throw 'You are not friend with this user.'
        }

        // Main query to get the friends list
        const query = ` SELECT
                            id,
                            username,
                            first_name,
                            last_name,
                            birth_date,
                            gender,
                            location,
                            description,
                            users.created
                        FROM friends
                        LEFT JOIN users ON id = user_one_id OR id = user_two_id
                        WHERE (id != ? AND id != ?) AND (user_one_id = ? OR user_two_id = ?) AND accepted = true`
        const [results] = await database.query(query, [userId, connectedUserId, userId, userId])

        res.send(results)
    } catch (err) {
        res.status(500).send({'error': err})
    }
})

// Get a list of mutual friends between a given user and the connected one
// Inspiration : https://stackoverflow.com/questions/36096713/finding-mutual-friend-sql
router.get('/mutuals/:user_id', tools.isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.user_id
        const connectedUserId = req.user.id

        const query = ` SELECT
                            id,
                            username,
                            first_name,
                            last_name,
                            birth_date,
                            gender,
                            location,
                            description,
                            created
                        FROM
                        (
                            SELECT user_one_friend.friend_id FROM
                            (
                                SELECT user_one_id friend_id FROM friends WHERE user_two_id = ? AND accepted = true
                                UNION 
                                SELECT user_two_id friend_id FROM friends WHERE user_one_id = ? AND accepted = true
                            ) AS user_one_friend
                            JOIN
                            (
                                SELECT user_one_id friend_id FROM friends WHERE user_two_id = ? AND accepted = true
                                UNION 
                                SELECT user_two_id friend_id FROM friends WHERE user_one_id = ? AND accepted = true
                            ) AS user_two_friend
                            ON user_one_friend.friend_id = user_two_friend.friend_id
                        ) AS friends
                        LEFT JOIN users ON users.id = friends.friend_id`
        const [results] = await database.query(query, [userId, userId, connectedUserId, connectedUserId])

        res.send(results)
    } catch (err) {
        res.status(500).send({'error': err})
    }
})

// Invite a given user by the authenticated user
// Inspiration : https://stackoverflow.com/questions/1361340/how-to-insert-if-not-exists-in-mysql
router.post('/invite', tools.isAuthenticated, async (req, res) => {
    try {
        const invitedUserId = req.body.user_id
        const invitingUserId = req.user.id

        const query = ` INSERT INTO friends (user_one_id, user_two_id)
                        SELECT ?, ?
                        FROM friends
                        WHERE NOT EXISTS (
                            SELECT *
                            FROM friends
                            WHERE user_one_id = ? AND user_two_id = ?)
                        LIMIT 1`
        await database.query(query, [invitingUserId, invitedUserId, invitedUserId, invitingUserId])

        res.send({'success': true})
    } catch (err) {
        res.status(500).send({'error': err})
    }
})

// Get a list of all pending invitations sent to the authenticated user
router.get('/invitations', tools.isAuthenticated, async (req, res) => {
    try {
        const connectedUserId = req.user.id

        const query = ` SELECT
                            users.id AS user_id,
                            username,
                            first_name,
                            last_name,
                            birth_date,
                            gender,
                            location,
                            description,
                            users.created AS user_created,
                            friends.created AS invitation_created
                        FROM friends
                        LEFT JOIN users ON user_one_id = id
                        WHERE user_two_id = ? AND accepted = false`
        const [results] = await database.query(query, [connectedUserId])

        res.send(results)
    } catch (err) {
        res.status(500).send({'error': err})
    }
})

// Accept an invitation sent by a given user to the authenticated one
router.post('/accept', tools.isAuthenticated, async (req, res) => {
    try {
        const invitingUserId = req.body.user_id
        const invitedUserId = req.user.id

        const query = ` UPDATE friends
                        SET accepted = true
                        WHERE friends.user_one_id = ? AND friends.user_two_id = ?`
        await database.query(query, [invitingUserId, invitedUserId])
        
        res.send({'success': true})
    } catch (err) {
        res.status(500).send({'error': err})
    }
})

module.exports = router