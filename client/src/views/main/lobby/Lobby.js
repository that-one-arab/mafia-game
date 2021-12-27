import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useInterval } from '../../../hooks';

function Timer({ timer, setTimer }) {
    useInterval(() => {
        timer !== 0 && setTimer((prevVal) => prevVal - 1);
    }, 1000);

    return (
        <div>
            <h3>{timer} </h3>
        </div>
    );
}

function Countdown({ start, timer, setTimer }) {
    if (start) {
        return <Timer timer={timer} setTimer={setTimer} />;
    } else return null;
}

function Lobby({ socket }) {
    const dispatch = useDispatch();
    const history = useHistory();
    const myPlayer = useSelector((state) => state.myPlayer);

    /** Redux main state */
    const { lobbyCode, players } = useSelector((state) => state.lobby);
    const { playersAmount } = useSelector((state) => state.gameOptions);
    // console.log({ lobbyCode, players, myPlayer, playersAmount });

    const [timer, setTimer] = useState(10);
    const [startCountdown, setStartCountdown] = useState(false);

    useEffect(() => {
        if (myPlayer.isOwner) {
            // console.log('firing create-room');
            socket.emit('create-room', lobbyCode, (res) => {
                if (res.status !== 201) console.warn({ res });
            });
        }
    }, [socket, myPlayer, lobbyCode]);

    useEffect(() => {
        if (!myPlayer.isOwner) {
            socket.emit('join-room', lobbyCode, myPlayer.playerName, (res) => {
                // console.log('firing join-room');
                if (res.status !== 200) console.warn({ res });

                dispatch({ type: 'SET_PLAYER_ID', payload: res.playerID });
                dispatch({
                    type: 'SET_PLAYERS_AMOUNT',
                    payload: res.playersAmount,
                });
            });
        }
    }, [socket, dispatch, myPlayer.playerName, myPlayer.isOwner, lobbyCode]);

    useEffect(() => {
        socket.on('lobby-players', (res) => {
            // console.log('listened to lobby-players, res: ', res);
            dispatch({ type: 'SET_PLAYERS', payload: res.payload.players });
        });

        socket.on('room-destroyed', (res) => {
            if (res.reason === 'Lobby room owner has exited')
                history.push(
                    '/join-game/enter-code?joinStatus=lobby-owner-exited'
                );
        });
    }, [socket, dispatch, history]);

    useEffect(() => {
        socket.on('start-countdown', () => {
            // console.log('starting countdown...');
            setStartCountdown(true);
        });

        socket.on('stop-countdown', () => {
            // console.log('stopped countdown!');
            setTimer(10);
            setStartCountdown(false);
        });
    }, [socket, history]);

    useEffect(() => {
        if (
            myPlayer.isOwner &&
            players.length === playersAmount &&
            timer === 0
        ) {
            socket.emit('initialize-game', lobbyCode);
        }
    }, [socket, myPlayer.isOwner, players, playersAmount, timer, lobbyCode]);

    useEffect(() => {
        socket.on('start-game', () => {
            history.push('/game');
        });
    }, [socket, history]);

    return (
        <div>
            <Countdown
                start={startCountdown}
                timer={timer}
                setTimer={setTimer}
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
                <h2>{lobbyCode} </h2>
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
                    {players.length
                        ? players.map((p, i) => (
                              <tr
                                  key={p.playerID}
                                  style={{
                                      backgroundColor: p.isOwner
                                          ? 'grey'
                                          : 'white',
                                  }}
                              >
                                  <th scope='col'>#{i + 1}</th>
                                  <th scope='col'>{p.playerName} </th>
                              </tr>
                          ))
                        : null}
                </tbody>
            </table>
        </div>
    );
}

export default function LobbyWrapper() {
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

    if (socket) return <Lobby socket={socket} />;
    else return null;
}
