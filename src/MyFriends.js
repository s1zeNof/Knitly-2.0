import React from 'react';
import { useUserContext } from './UserContext';

const MyFriends = () => {
    const { user } = useUserContext();

    return (
        <div>
            <h1>{user?.displayName}'s Friends</h1>
        </div>
    );
};

export default MyFriends;
