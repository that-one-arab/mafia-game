import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import { Toaster } from '../../../components';
import { useHistory } from 'react-router-dom';

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
    const history = useHistory();
    const player = useSelector((state) => state.player);
    const [toast, setToast] = useState({ show: 0, header: '', body: '' });

    /** Redux main state */
    const { roomCode, roomOwner, players, isRoomVerified } = useSelector(
        (state) => state.game
    );

    console.log({ player, roomCode, roomOwner, players });

    /** An array of players that are parsed according to certain cases (who's the owner, who's the current player etc...) */
    // const players = parseGamePlayers(player, joinedPlayers, roomOwner);

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
                    console.log(
                        'emitting the following values :',
                        roomCode,
                        player.name
                    );
                    socket.emit(
                        'join-room',
                        roomCode,
                        player.name,
                        (response) => {
                            console.log('Response arrived, res: ', response);
                            if (response.status === 200)
                                dispatch({ type: 'SET_ROOM_VERIFIED' });
                            else if (response.status === 405) {
                                history.push(
                                    '/join-game/enter-code?joinStatus=room-full'
                                );
                            }
                        }
                    );
                }
            }
        }
    }, [socket, roomCode, dispatch, player, roomOwner, history]);
    useEffect(() => {
        if (socket) {
            if (isRoomVerified) {
                /** Do something */
            }
        }
    }, [socket, isRoomVerified]);

    useEffect(() => {
        if (socket) {
            socket.on('lobby-players', (res) => {
                console.log('lobby-players emit :', res);
                const { players } = res.payload;
                console.log('players array from res :', players);

                dispatch({ type: 'SET_PLAYERS', payload: players });

                if (res.message === 'The game is about to start') {
                    // START THE GAME
                }
            });
        }
    }, [socket, dispatch]);

    return (
        <div>
            <Toaster toast={toast} setToast={setToast} />
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
                            key={p.playerID}
                            style={{
                                backgroundColor: p.isOwner ? 'grey' : 'white',
                            }}
                        >
                            <th scope='col'>#{i + 1}</th>
                            <th scope='col'>{p.playerName} </th>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
