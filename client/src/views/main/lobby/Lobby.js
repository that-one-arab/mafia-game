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

    const players = parseGamePlayers(player, joinedPlayers, roomOwner);
    console.log({ players });

    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(`http://localhost:8080`, {
            transports: ['websocket'],
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, [setSocket]);

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
                                backgroundColor: player.isOwner
                                    ? 'grey'
                                    : 'white',
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
