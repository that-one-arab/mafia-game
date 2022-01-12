import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useInterval } from '../../../hooks';
import { WEBSOCKET_ENDPOINT } from '../../../global';

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
    const { gameOptions } = useSelector((state) => state);
    const { playersAmount } = gameOptions;
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
            if (res.reason === 'Lobby room owner has exited') history.push('/join-game/enter-code?joinStatus=lobby-owner-exited');
        });
    }, [socket, dispatch, history]);

    useEffect(() => {
        socket.on('start-countdown', () => {
            // console.log('starting countdown...');
            setStartCountdown(true);

            window.sessionStorage.setItem('global-myplayer', JSON.stringify(myPlayer));
            window.sessionStorage.setItem('global-gameoptions', JSON.stringify(gameOptions));
            window.sessionStorage.setItem('global-lobbycode', lobbyCode);
        });

        socket.on('stop-countdown', () => {
            // console.log('stopped countdown!');
            setTimer(10);
            setStartCountdown(false);
        });
    }, [socket, history, myPlayer, gameOptions, lobbyCode]);

    useEffect(() => {
        if (myPlayer.isOwner && players.length === playersAmount && timer === 0) {
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
            <section className='game lobby-1'>
                <div className='game__share'>
                    <p className='game__share--paragraph-1 padding_top-bottom'>Your code is</p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span className='game__share--paragraph game-code '>{lobbyCode}</span>
                        <button
                            style={{ marginLeft: '10px' }}
                            type='button'
                            className='btn btn-outline-secondary'
                            onClick={() => navigator.clipboard.writeText(lobbyCode)}
                        >
                            <i className='far fa-clipboard'></i>
                        </button>
                    </div>
                    <br />
                    <p>Give this to other players so they can join your lobby</p>
                    <br />
                    {startCountdown && (
                        <>
                            <p className='game__share--paragraph'>Game will started in</p>
                            <Countdown start={startCountdown} timer={timer} setTimer={setTimer} />
                        </>
                    )}
                </div>

                <div className='game__table'>
                    <div className='game__table--container'>
                        <table id='tab' className='table content-table-people'>
                            <thead>
                                <tr>
                                    <th scope='col'> </th>
                                    <th scope='col'>Player Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.length
                                    ? players.map((p, i) => (
                                          <tr className={`${myPlayer.playerID === p.playerID ? 'active-row' : ''}`} key={p.playerID}>
                                              <td>#{i + 1}</td>
                                              <td>{p.playerName} </td>
                                          </tr>
                                      ))
                                    : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function LobbyWrapper() {
    /** WebSocket */
    const [socket, setSocket] = useState(null);

    /** Socket initialization */
    useEffect(() => {
        const newSocket = io(`${WEBSOCKET_ENDPOINT}/lobby`, {
            transports: ['websocket'],
        });
        setSocket(newSocket);
        return () => {
            newSocket.removeAllListeners();
            newSocket.close();
        };
    }, [setSocket]);

    if (socket) return <Lobby socket={socket} />;
    else return null;
}
