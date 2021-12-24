import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

const parseGamePlayers = (player, players, owner) => {
    let res = [];

    if (players && players.length) {
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            if (p.ID !== owner.ID)
                res.push({ ID: p.ID, name: p.name, isOwner: false });
        }
    }

    if (owner && owner.ID)
        res.push({ ID: owner.ID, name: owner.name, isOwner: true });

    if (player && player.ID) {
        if (owner && owner.ID && player.ID !== owner.ID)
            res.push({ ID: player.ID, name: player.name, isOwner: false });
    }

    return res;
};

export default function Lobby() {
    const dispatch = useDispatch();
    const player = useSelector((state) => state.player);
    /** Redux main state */
    const { roomCode, roomOwner, joinedPlayers, isRoomVerified } = useSelector(
        (state) => state.game
    );

    console.log({ player, roomCode, roomOwner, joinedPlayers });

    /** An array of players that are parsed according to certain cases (who's the owner, who's the current player etc...) */
    const players = parseGamePlayers(player, joinedPlayers, roomOwner);

    /** WebSocket */
    const [socket, setSocket] = useState(null);

    /** Socket initialization */
    useEffect(() => {
        const newSocket = io(`http://localhost:8080/lobby`, {
            transports: ['websocket'],
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, [setSocket]);

    /** Socket events */
    useEffect(() => {
        /** Make sure the socket is not null */
        if (socket) {
            /** Initial room code verification */
            if (roomCode) {
                console.log(
                    'room code is present, proceeding to parsing the current player, values :',
                    { player, roomOwner }
                );
                if (roomOwner.ID === player.ID) {
                    socket.emit('create-room', roomCode, (response) => {
                        console.log('Response arrived, res: ', response);
                        if (response.status === 200)
                            dispatch({ type: 'SET_ROOM_VERIFIED' });
                    });
                } else {
                    socket.emit(
                        'join-room',
                        roomCode,
                        player.ID,
                        player.name,
                        (response) => {
                            console.log('Response arrived, res: ', response);
                            if (response.status === 200)
                                dispatch({ type: 'SET_ROOM_VERIFIED' });
                        }
                    );
                }
            }
        }
    }, [socket, roomCode, dispatch, player, roomOwner]);
    useEffect(() => {
        if (socket) {
            if (isRoomVerified) {
                /** Do something */
            }
        }
    }, [socket, isRoomVerified]);

    return (
        <div>
            <div>
                <button
                    onClick={() => {
                        socket.emit('log-server-vals');
                    }}
                >
                    Log server vals
                </button>
                <h1>This is the lobby!</h1>
                <p> Your code is </p>
                <h2>{roomCode} </h2>
                <p>Share this code with people who wanna join!</p>
            </div>
            <div>
                <p>Joined players table</p>
            </div>
            <table className='table'>
                <thead>
                    <tr>
                        <th scope='col'>#</th>
                        <th scope='col'>Player Name</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((p, i) => (
                        <tr
                            key={p.ID}
                            style={{
                                backgroundColor: p.isOwner ? 'grey' : 'white',
                            }}
                        >
                            <th scope='col'>#{i + 1}</th>
                            <th scope='col'>{p.name} </th>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
