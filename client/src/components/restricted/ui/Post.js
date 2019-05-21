import React, { useState } from 'react'
import { Card, Button } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { FaRetweet } from 'react-icons/fa'
import ReactTimeAgo from 'react-time-ago/commonjs/ReactTimeAgo'

import { post } from '../../API'

// Single post view with share button
// Required props : 'data' (post object from server)
export default function Post(props) {

    // Disable share button if the post has already been shared by the user
    const [shared, setShared] = props.data.shared ? useState(true) : useState(false)

    function postShare() {
        post('/post/share', { post_id: props.data.post_id })
        setShared(true)
    }

    function Share() {
        return (
            <Button variant="link" className="text-danger p-0" disabled={shared} onClick={postShare}>
                <FaRetweet className="mb-1" /> Share
            </Button>
        )
    }

    return (
        <Card className="my-4">
            <Card.Header>
                <ul className="list-inline mb-0">
                    {props.data.share_user_id ? (
                        <LinkContainer to={'/user/' + props.data.share_user_id}>
                            <Button variant="link" className="list-inline-item text-danger p-0" title={props.data.share_username}>
                                <FaRetweet /> {props.data.share_first_name} {props.data.share_last_name}
                            </Button>
                        </LinkContainer>
                    ) : null}
                    <LinkContainer to={'/user/' + props.data.post_user_id}>
                        <Button variant="link" className="list-inline-item text-dark p-0" title={props.data.post_username}>
                            {props.data.post_first_name} {props.data.post_last_name}
                        </Button>
                    </LinkContainer>
                    <li className="list-inline-item align-middle">
                        <small className="text-muted"><ReactTimeAgo date={props.data.created} /></small>
                    </li>
                    <li className="list-inline-item float-right">
                        <Share />
                    </li>
                </ul>
            </Card.Header>
            <Card.Body>
                <Card.Text>{props.data.content}</Card.Text>
            </Card.Body>
        </Card>
    )
}