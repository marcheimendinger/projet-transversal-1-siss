const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const moment = require('moment')

const tools = require('../tools')
const database = require('../database')

module.exports = (passport) => {

    // Register a new user
    router.post('/register', async (req, res) => {
        try {
            let user = req.body

            user = tools.emptyStringToNull(user)

            // Prevent bug with 'me' functions returning authenticated user's data
            if (user.username == 'me') {
                throw 'This username is already taken'
            }

            if (!user.password) {
                throw 'The password field is required'
            }
            const hash = await bcrypt.hash(user.password, 10)
            user.password = hash

            const query = `INSERT INTO users SET ?`
            const [results] = await database.query(query, [user])
    
            // Automatically trigger Passport authentication
            user.id = results.insertId
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).send({'error': err})
                }
                res.send({'success': true})
            })
        } catch (err) {
            res.status(500).send({'error': err})
        }
    })

    // Login a user
    // If accepted, creation of a session and cookie
    router.post('/login', passport.authenticate('local'), (req, res) => {
        res.send({'success': true})
    })

    // Logout the authenticated user (clear the session)
    router.get('/logout', tools.isAuthenticated, (req, res) => {
        req.logout()
        res.send({'success': true})
    })

    // Update informations of authenticated user
    router.post('/update', tools.isAuthenticated, async (req, res) => {
        try {
            let newInformations = req.body

            // Prevent update of 'id' and 'created' fields
            delete(newInformations.id)
            delete(newInformations.created)

            // Prevent error if only an empty password is sent
            // (meaning it doesn't need to be updated)
            if (newInformations.password === '' || newInformations.password === null) {
                delete(newInformations.password)
            }

            // Prevent error if no information to update
            if (Object.keys(newInformations).length === 0) {
                return res.send({'success': true})
            }

            newInformations = tools.emptyStringToNull(newInformations)

            if (newInformations.password) {
                const hash = await bcrypt.hash(newInformations.password, 10)
                newInformations.password = hash
            }

            // Change date format
            if (newInformations.birth_date) {
                newInformations.birth_date = moment(newInformations.birth_date).format('YYYY-MM-DD')
            }

            const query = ` UPDATE users
                            SET ?
                            WHERE id = ?`
            await database.query(query, [newInformations, req.user.id])

            res.send({'success': true})
        } catch (err) {
            res.status(500).send({'error': err})
        }
    })

    // Get all informations from a given user
    router.get('/view', tools.isAuthenticated, async (req, res) => {
        try {
            const connectedUserId = req.user.id
            let id = req.query.user_id
            let username = req.query.username
            let columns = 'id, username, first_name, last_name, birth_date, gender, location, description, created'

            // Prevent use of both 'id' and 'username' query parameters at the same time
            if (id) {
                username = ""
            }

            // If parameter is 'me', get the authenticated user's id and add email data to the query
            if (id == 'me') {
                id = req.user.id
                columns += ', email'
            }

            const query = ` SELECT ${columns}
                            FROM users
                            WHERE id = ? OR username = ?`
            const [results] = await database.query(query, [id, username])
            let user = results[0]

            if (user) {
                // Add friendship state with authenticated user
                user = {
                    ...user,
                    friendship: await tools.getFriendship(connectedUserId, user.id),
                    is_me: connectedUserId == id
                }
                res.send(user)
            } else {
                res.send({})
            }
        } catch (err) {
            res.status(500).send({'error': err})
        }
    })

    // Get a list of users with 'username', 'first_name' or 'last_name' corresponding to 'search_content'
    router.get('/search', tools.isAuthenticated, async (req, res) => {
        try {
            const searchContent = '%' + req.query.search_content + '%'
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
                            FROM users
                            WHERE username LIKE ? OR first_name LIKE ? OR last_name LIKE ?
                            LIMIT 25`
            const [results] = await database.query(query, [searchContent, searchContent, searchContent])
            res.send(results)
        } catch (err) {
            res.status(500).send({'error': err})
        }
    })

    return router
    
}