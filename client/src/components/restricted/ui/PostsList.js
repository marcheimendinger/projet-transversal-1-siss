import React, { useState, useEffect, Fragment } from 'react'
import { Button } from 'react-bootstrap'

import API from '../../API'

import Post from './Post'
import Error from './Error'

// Post list (with 'Show more' button) fetch and view
// Required props : 'url' (for API request)
// Facultative props :  'user_id' (if 'url' = '/post/by')
//                      'refresh' (if you want the list to update when 'refresh' is updated)
export default function PostsList(props) {

    const [feed, setFeed] = useState([])

    const [feedNextPage, setFeedNextPage] = useState([])

    const [paging, setPaging] = useState(1)

    const url = props.url

    async function getFeed(page) {
        try {
            let resultsFeed = []
            if (page === 0) {
                // Fetch first page from server
                resultsFeed = await API.get(url, {
                    params: { paging: page, user_id: props.user_id }
                })
                setFeed(resultsFeed.data)
            } else {
                // Fetch new page from cache
                setFeed(feed.concat(feedNextPage))
            }

            // Fetch next page in background
            const resultsFeedNext = await API.get(url, {
                params: { paging: page + 1, user_id: props.user_id }
            })
            setFeedNextPage(resultsFeedNext.data)
        } catch (e) {
            console.log(e)
        }
    }

    function updateFeed() {
        getFeed(paging)
        setPaging(paging + 1)
    }

    function Feed() {
        if (feed.length === 0) {
            return <Error text="No post to show" />
        }

        return (
            feed.map(post => (
                <Post key={"" + post.share_user_id + post.post_id} data={post} />
            ))
        )
    }

    function ShowMoreButton() {
        if (feedNextPage.length === 0) {
            return null
        }

        return (
            <Button variant="danger" className="mx-auto d-block" onClick={updateFeed}>Show more</Button>
        )
    }

    // Run when component is mounted and when 'props' is updated
    useEffect(() => {
        getFeed(0)
        setPaging(1)
    }, [props])

    return (
        <Fragment>
            <Feed />
            <ShowMoreButton />
        </Fragment>
    )
    
}