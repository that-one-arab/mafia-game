import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import { Toaster } from '../../../components';
import { useHistory } from 'react-router-dom';
import { useInterval } from '../../../hooks';

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

function Countdown({ gameStarting }) {
    const [timer, setTimer] = useState(10);
    // console.log({ timer });

    useInterval(() => {
        timer !== 0 && setTimer((prevVal) => prevVal - 1);
    }, 1000);

    useEffect(() => {
        if (!gameStarting) setTimer(10);
    }, [gameStarting, timer]);

    if (gameStarting) {
        return (
            <div>
                <h3>{timer} </h3>
            </div>
        );
    } else return null;
}

export default function Lobby() {
    const dispatch = useDispatch();
    const history = useHistory();
    const player = useSelector((state) => state.player);
    const [toast, setToast] = useState({ show: 0, header: '', body: '' });
    const [gameReadyToStart, setGameReadyToStart] = useState(false);
    const [gameStarting, setGameStarting] = useState(false);
    // console.log({ gameStarting });

    /** Redux main state */
    const { roomCode, roomOwner, players, isRoomVerified } = useSelector(
        (state) => state.game
    );

    const playersAmount = useSelector(
        (state) => state.gameOptions.playersAmount
    );

    // console.log({ player, roomCode, roomOwner, players });

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

    /** Room owner socket event */
    useEffect(() => {
        /** Make sure the socket is not null */
        if (socket) {
            /** Initial room code verification */
            if (roomCode) {
                if (roomOwner.ID === player.ID) {
                    socket.emit('create-room', roomCode, (response) => {
                        // console.log('create-room cb res: ', response);
                        if (response.status === 200)
                            dispatch({ type: 'SET_ROOM_VERIFIED' });
                    });
                }
            }
        }
    }, [socket, roomCode, dispatch, player, roomOwner]);

    /** Player joining room socket event */
    useEffect(() => {
        if (socket) {
            /** the player.ID field populates from the below response, here we make sure it runs only once */
            if (roomCode && roomOwner.ID !== player.ID && player.ID === '') {
                socket.emit('join-room', roomCode, player.name, (response) => {
                    console.log('join-room cb res: ', response);
                    if (response.status === 200) {
                        dispatch({ type: 'SET_ROOM_VERIFIED' });
                        dispatch({
                            type: 'SET_PLAYER_ID',
                            payload: response.playerID,
                        });
                    } else if (response.status === 405) {
                        history.push(
                            '/join-game/enter-code?joinStatus=room-full'
                        );
                    }
                });
            }
        }
    }, [roomCode, dispatch, history, player, roomOwner, socket]);

    useEffect(() => {
        if (socket) {
            if (isRoomVerified) {
                /** Do something */
            }
        }
    }, [socket, isRoomVerified]);

    /** lobby-players event (server feeds us information about the room here) */
    useEffect(() => {
        if (socket) {
            socket.on('lobby-players', (res) => {
                console.log('lobby-players res :', res);
                if (res.message === 'Lobby room owner has exited') {
                    history.push(
                        '/join-game/enter-code?joinStatus=lobby-owner-exited'
                    );
                } else {
                    const { players, playersAmount } = res.payload;

                    console.log('dispatching set_players');
                    dispatch({ type: 'SET_PLAYERS', payload: players });
                    console.log('dispatching set_players_amount');
                    dispatch({
                        type: 'SET_PLAYERS_AMOUNT',
                        payload: playersAmount,
                    });

                    console.log('res.message = ', res.message);
                    console.log('playerID :', player.ID);

                    if (res.message === 'The game is about to start') {
                        setGameReadyToStart(true);
                    }
                }
            });
        }
    }, [socket, dispatch, history, player.ID]);

    useEffect(() => {
        if (socket) {
            if (gameReadyToStart && player.ID !== '') {
                console.log(
                    'Message = "The game is about to start", emitting "start-game-confirm"'
                );
                socket.emit('start-game-confirm', player.ID, (res) => {
                    console.log('start-game-confirm res :', res);
                    if (res.status === 201 || res.status === 200) {
                        console.log('setting gameStarting to true');
                        setGameStarting(true);
                    }
                });
            }
        }
    }, [socket, gameReadyToStart, playersAmount, players, player]);

    return (
        <div>
            <Toaster toast={toast} setToast={setToast} />
            <Countdown gameStarting={gameStarting} />
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
