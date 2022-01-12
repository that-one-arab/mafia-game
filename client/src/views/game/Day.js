/**
 * Day counter
 * Time counter
 * Players
 * Vote time
 */

import { useEffect, useState } from 'react';
import { gameEls } from '../../assets/svg';
import { useInterval } from '../../hooks';
import { ToastContainer, toast } from 'react-toastify';

function getRoleSvgAndDescription(playerRole) {
    const { component, description } = gameEls.find((el) => el.name === playerRole);

    return { component, description };
}

function useTimer({ timer, setTimer, paused }) {
    useInterval(() => {
        timer && !paused && setTimer((prevVal) => prevVal - 1);
    }, 1000);
}

export default function Day({ state, dispatch, socket, setPausedTimer }) {
    const lobbyCode = window.sessionStorage.getItem('global-lobbycode');

    const [movedToDayFired, setMovedToDayFired] = useState(false);
    const [timer, setTimer] = useState(undefined);
    const [discussStart, setDiscussStart] = useState(false);
    const [dayRes, setDayRes] = useState([]);
    const [dayResFired, setDayResFired] = useState(false);

    const [voteStart, setVoteStart] = useState(false);
    const [voteFinished, setVoteFinished] = useState(false);
    const [gameEnded, setGameEnded] = useState(undefined);
    const [gameEndedFired, setGameEndedFired] = useState(false);

    const [votes, setVotes] = useState(state.players.map((p) => ({ playerID: p.playerID, voters: [] })));

    const [lynchResult, setLynchResult] = useState(undefined);

    const [paused, setPaused] = useState(false);

    useTimer({ timer, setTimer, paused });

    /** Server would pause and unpause game if players who are still alive disconnected */
    useEffect(() => {
        socket.on('pause-game', () => {
            socket.emit('current-time', lobbyCode, timer);
            setPausedTimer(30);
            setPaused(true);
            dispatch({ type: 'PAUSE_GAME', payload: true });
        });
    }, [socket, dispatch, setPausedTimer, timer, lobbyCode]);

    useEffect(() => {
        socket.on('unpause-game', () => {
            setPausedTimer(undefined);
            setPaused(false);
            dispatch({ type: 'PAUSE_GAME', payload: false });
        });

        if (state.gameProgress.currentTimer) {
            setTimer(state.gameProgress.currentTimer);
            dispatch({ type: 'CLEANUP_TIMER' });
        }
    }, [socket, dispatch, setPausedTimer, state.gameProgress.currentTimer]);

    useInterval(() => {
        if (timer && timer > 15) {
            console.log('emitting sync-time...');
            socket.emit('sync-time', lobbyCode, state.myPlayer.playerID, timer);
        }
    }, 15000);

    useEffect(() => {
        socket.on('synced-time', (newTimer) => {
            console.log('recieved synced-time, new timer: ', newTimer);
            setTimer(newTimer);
        });
    }, [socket]);

    /** Fires once */
    useEffect(() => {
        if (!movedToDayFired) {
            socket.emit('moved-to', 'day', lobbyCode, state.myPlayer.playerID);
            setMovedToDayFired(true);
        }
    }, [socket, lobbyCode, state.players, state.myPlayer.playerID, movedToDayFired]);

    useEffect(() => {
        if (!dayResFired && dayRes.length) {
            setDayResFired(true);
            setTimeout(async () => {
                const dayResUniq = [...new Map(dayRes.map((v) => [v.id, v])).values()];
                dayResUniq.forEach((result) => {
                    toast.error(
                        () => (
                            <div>
                                {' '}
                                <p>
                                    <strong> {result.playerName + ' '}</strong>
                                    Has died. They were{' '}
                                    <strong style={{ color: result.playerTeam === 'MAFIA' ? 'red' : 'green' }}>
                                        {' '}
                                        {result.playerRole}{' '}
                                    </strong>
                                </p>{' '}
                            </div>
                        ),
                        {
                            position: 'top-center',
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: 'colored',
                        }
                    );
                });

                await new Promise((r) => {
                    setTimeout(() => {
                        console.log('setting discussStart to true');
                        setDiscussStart(true);
                        r();
                    }, 4000);
                });
            }, 2000);
        }
    }, [dayRes, dayResFired]);

    useEffect(() => {
        socket.on('all-players-in-room', (room) => {
            console.log('all-players-in-room');
            socket.emit('get-game-props', lobbyCode, state.myPlayer.playerID, async (res) => {
                console.log('get-game-props :', res);
                dispatch({
                    type: 'SET_GAME_PROPS',
                    payload: {
                        gameProgress: {
                            ...res.props.gameProgress,
                            isRoleAssigned: res.props.gameProgress.areRolesAssigned,
                        },
                        players: res.props.players,
                    },
                });

                const myPlayer = res.props.players.find((p) => p.playerID === state.myPlayer.playerID);
                dispatch({ type: 'SET_PLAYER', payload: myPlayer });
                if (room === 'day') {
                    if (res.props.gameProgress.dayResult.length) {
                        setDayRes(res.props.gameProgress.dayResult);
                    } else {
                        setDiscussStart(true);
                    }

                    if (res.props.gameProgress.dayCount !== 1) {
                        setTimer(60);
                    } else {
                        setTimer(10);
                    }
                }
            });
        });
    }, [socket, dispatch, discussStart, state.gameProgress.dayCount, state.myPlayer.playerID, lobbyCode]);

    /** Initial discuss timer ended,  */
    useEffect(() => {
        if (timer === 0 && !voteStart) {
            if (state.gameProgress.dayCount === 1) {
                setVoteFinished(true);
            } else {
                setTimer(20);
                setVoteStart(true);
            }
        }
    }, [timer, voteStart, state.gameProgress.dayCount]);

    useEffect(() => {
        if (voteFinished && state.myPlayer.isOwner) {
            socket.emit('transition-ready', lobbyCode, state.myPlayer.playerID);
        }
    }, [voteFinished, socket, state.myPlayer.isOwner, lobbyCode, state.myPlayer.playerID]);

    useEffect(() => {
        socket.on('transition-to', (to) => {
            dispatch({ type: 'TRANSITION_TO', payload: to });
        });
    }, [socket, dispatch]);

    useEffect(() => {
        socket.on('votes', (votes) => {
            setVotes(votes);
        });
    }, [socket]);

    useEffect(() => {
        if (voteStart && !voteFinished && timer === 0 && state.myPlayer.isOwner) {
            socket.emit('vote-finished', lobbyCode);
        }
    }, [socket, voteStart, voteFinished, timer, state.myPlayer.isOwner, lobbyCode]);

    useEffect(() => {
        socket.on('vote-result', async (player) => {
            console.log('vote-result :', player);
            if (player) {
                console.log('setting lynchResult to player', player);
                setLynchResult(player);

                await new Promise((r) => {
                    setTimeout(() => {
                        console.log('setting voteFinished to true');
                        setVoteFinished(true);
                        r();
                    }, 4000);
                });
            } else {
                setVoteFinished(true);
            }
        });
    }, [socket]);

    useEffect(() => {
        if (lynchResult) {
            console.log('lynchResult is present, rendering a toast...');
            toast.error(
                () => (
                    <div>
                        {' '}
                        <p>
                            <strong> {lynchResult.playerName + ' '}</strong>
                            Has been hanged. They were{' '}
                            <strong style={{ color: lynchResult.playerTeam === 'MAFIA' ? 'red' : 'green' }}>
                                {' '}
                                {lynchResult.playerRole}{' '}
                            </strong>
                        </p>{' '}
                    </div>
                ),
                {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'colored',
                }
            );
        }
    }, [lynchResult]);

    const { component: Svg, description } = getRoleSvgAndDescription(state.myPlayer.playerRole);

    useEffect(() => {
        socket.on('game-ended', (winner, players) => {
            setGameEnded({ winner, players });
        });
    }, [socket, dispatch]);

    useEffect(() => {
        if (!gameEndedFired && gameEnded) {
            setGameEndedFired(true);
            setTimeout(async () => {
                toast.success('The game has ended!', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'colored',
                });

                setTimeout(() => {
                    console.log('dispatching GAME_ENDED with value :', gameEnded);
                    dispatch({ type: 'GAME_ENDED', payload: gameEnded });
                }, 3000);
            }, 2000);
        }
    }, [gameEndedFired, gameEnded, dispatch]);

    const voteDisabledHandler = (player) => {
        if (!state.myPlayer.playerAlive) return true;

        if (!player.playerAlive) return true;

        if (state.myPlayer.playerID === player.playerID) return true;
        return false;
    };

    const voteDisabledHandlerClass = (player) => {
        if (!state.myPlayer.playerAlive) return 'btn-vote-disabled';

        if (!player.playerAlive) return 'btn-vote-disabled';

        if (state.myPlayer.playerID === player.playerID) return 'btn-vote-disabled';
        return 'btn-vote';
    };

    return (
        <div>
            <section className='game day game-flex-container'>
                <div className='game__info'>
                    <p className='game__info-day'>Day {state.gameProgress.dayCount} </p>
                    <p className='game__info-time'>Time {timer}s </p>
                </div>

                <div className='game__table'>
                    <div className='game__table--container'>
                        <table id='tab' className='table content-table-people'>
                            <thead>
                                <tr>
                                    <th scope='col'>Name</th>

                                    <th scope='col'></th>
                                    <th scope='col'>{voteStart && !voteFinished && 'Votes'} </th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.players.length
                                    ? state.players.map((p, i) => (
                                          <tr
                                              key={p.playerID}
                                              className={`${!p.playerAlive && 'dead-row'} ${
                                                  p.playerID === state.myPlayer.playerID ? 'active-row' : ''
                                              }`}
                                              style={{ marginBottom: '10px' }}
                                          >
                                              <td>{p.playerName}</td>
                                              <td>
                                                  {voteStart && !voteFinished && (
                                                      <button
                                                          disabled={voteDisabledHandler(p)}
                                                          onClick={() =>
                                                              socket.volatile.emit(
                                                                  'vote-for',
                                                                  lobbyCode,
                                                                  state.myPlayer.playerID,
                                                                  p.playerID
                                                              )
                                                          }
                                                          className={`${voteDisabledHandlerClass(p)}`}
                                                      >
                                                          +
                                                      </button>
                                                  )}
                                              </td>
                                              <td>
                                                  {voteStart && <p>{votes.find((vote) => vote.playerID === p.playerID).voters.length}</p>}
                                              </td>
                                          </tr>
                                      ))
                                    : null}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className='result' style={{ marginTop: 'auto' }}>
                    <div className='result__container'>
                        <div className='status'>
                            <p className='role'>{description}</p>
                            <br />
                        </div>
                        <div className='stat__box'>
                            <div className='stat__box--icon'> {Svg} </div>
                        </div>
                    </div>
                </div>
            </section>

            <ToastContainer
                position='top-center'
                autoClose={7000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                draggable
                pauseOnHover
                pauseOnFocusLoss={false}
            />
        </div>
    );
}
