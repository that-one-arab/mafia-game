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

function Countdown({ gameStarting, setTimerEnded }) {
    const [timer, setTimer] = useState(10);
    // console.log({ timer });

    useInterval(() => {
        timer !== 0 && setTimer((prevVal) => prevVal - 1);
    }, 1000);

    useEffect(() => {
        if (!gameStarting) setTimer(10);
        if (timer === 0) setTimerEnded(true);
    }, [gameStarting, timer, setTimerEnded]);

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
    const [readyToBePushed, setReadyToBePushed] = useState(false);
    const [timerEnded, setTimerEnded] = useState(false);
    // console.log({ gameStarting });

    /** Redux main state */
    const { roomCode, roomOwner, players, isRoomVerified } = useSelector(
        (state) => state.game
    );

    console.log({ roomOwner });

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

    /** create-room emitter (Room owner socket event) */
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

    /** join-room emitter (Player joining room socket event) */
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

    /** lobby-players listener (server feeds us information about the room here) */
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

    /** create-game-room emitter (once players are ready, has game owner create a game room) */
    useEffect(() => {
        if (socket) {
            if (
                gameReadyToStart &&
                player.ID !== '' &&
                roomOwner.ID === player.ID
            ) {
                console.log(
                    'game ready to start, emitting create-game-room...'
                );
                socket.emit('create-game-room', player.ID, (res) => {
                    console.log('create-game-room res :', res);
                });
            }
        }
    }, [socket, gameReadyToStart, playersAmount, players, player, roomOwner]);

    useEffect(() => {
        if (socket) {
            socket.on('game-room-created', () => {
                console.log('setting gameStarting to true');
                setGameStarting(true);
            });
        }
    }, [socket]);

    /** join-game-room emitter (once players are ready, and countdown has finished, has players join a game room) */
    useEffect(() => {
        if (socket) {
            if (gameStarting && player.ID !== '') {
                console.log('game starting, emitting join-game-room...');
                socket.emit('join-game-room', player.ID, (res) => {
                    console.log('join-game-room res :', res);
                });
            }
        }
    }, [socket, gameStarting, playersAmount, players, player]);

    /** start-game emitter */
    useEffect(() => {
        if (socket) {
            if (timerEnded && player.ID === roomOwner.ID) {
                console.log('start-game emitting roomCode :', roomCode);
                socket.emit('start-game', roomCode);
            }
        }
    }, [socket, timerEnded, roomCode, roomOwner, player]);

    /** proceed-to-game listener (after countdown is finished, pushes players to /game route) */
    useEffect(() => {
        if (socket) {
            socket.on('proceed-to-game', () => {
                console.log(
                    'proceed-to-game emitted, setting readyToBePushed to true'
                );
                setReadyToBePushed(true);
            });
        }

        if (timerEnded && readyToBePushed) {
            console.log('proceeding to game');
            history.push('/game');
        }
    }, [socket, history, timerEnded, readyToBePushed]);

    return (
        <div>
            <Toaster toast={toast} setToast={setToast} />
            <Countdown
                gameStarting={gameStarting}
                setTimerEnded={setTimerEnded}
            />
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
