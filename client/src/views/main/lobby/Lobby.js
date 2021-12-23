import { useSelector } from 'react-redux';
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
    const player = useSelector((state) => state.player);
    const { roomCode, roomOwner, joinedPlayers } = useSelector(
        (state) => state.game
    );

    console.log({ player, roomCode, roomOwner, joinedPlayers });

    /** An array of players that are parsed according to certain cases (who's the owner, who's the current player etc...) */
    const players = parseGamePlayers(player, joinedPlayers, roomOwner);

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
                console.log('emittingverify-room with roomCode :', roomCode);
                socket.emit('verify-room', roomCode, (response) => {
                    console.log('Response arrived, res: ', response);
                });
            }
        }
    }, [socket, roomCode]);

    return (
        <div>
            <div>
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
