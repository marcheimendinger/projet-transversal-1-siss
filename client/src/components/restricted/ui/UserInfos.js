import React, { Fragment } from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import { Button } from 'react-bootstrap'
import { FaPen } from 'react-icons/fa'

// User main informations view
// Required props : 'data' (user object from server)
// Facultative props : 'edit' (boolean to true) to enable edition button
export default function UserInfos(props) {
    return (
        <Fragment>
            <ul className="list-inline mb-0">
                <li className="list-inline-item h1 text-danger">
                    {props.data.first_name} {props.data.last_name}
                </li>
                <li className="list-inline-item h2 text-muted">
                    @{props.data.username}
                </li>
                {props.edit ? 
                    <li className="list-inline-item ml-3">
                        <LinkContainer to="/me/edit" title="Edit my informations">
                            <Button variant="link" className="text-danger mb-3"><FaPen /></Button>
                        </LinkContainer>
                    </li>
                    : null
                }
            </ul>

            <ul className="list-inline">
                {props.data.birth_date ?
                    <li className="list-inline-item">{new Date(props.data.birth_date).toLocaleDateString()}</li>
                    : null
                }
                {props.data.gender ?
                    <li className="list-inline-item">{props.data.gender === 'm' ? 'Male' : 'Female'}</li>
                    : null
                }
                {props.data.location ?
                    <li className="list-inline-item">{props.data.location}</li>
                    : null
                }
            </ul>

            <p className="lead">{props.data.description}</p>

            <p className="text-muted small">Member since {new Date(props.data.created).toDateString()}</p>
        </Fragment>
    )
}