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

function useTimer({ timer, setTimer }) {
    useInterval(() => {
        timer && setTimer((prevVal) => prevVal - 1);
    }, 1000);
}

export default function Day({ state, dispatch, socket }) {
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

    useTimer({ timer, setTimer });

    /** Fires once */
    useEffect(() => {
        if (!movedToDayFired) {
            socket.emit('moved-to', 'day', lobbyCode, state.myPlayer.playerID);
            setMovedToDayFired(true);
        }
    }, [socket, lobbyCode, state.players, state.myPlayer.playerID, movedToDayFired]);

    useEffect(() => {
        if (!dayResFired && dayRes.length) {
            console.log('!dayResFired && dayRes.length. Begining setTimeout after 4s...');
            setDayResFired(true);
            setTimeout(async () => {
                console.log('setTimeout started...');
                const dayResUniq = [...new Map(dayRes.map((v) => [v.id, v])).values()];
                console.log('dayResUniq :', dayResUniq);
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
                        console.log('day-result :', res.props.gameProgress.dayResult);
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

    return (
        <div>
            <ToastContainer
                position='top-center'
                autoClose={7000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            {lynchResult && (
                <h1 style={{ color: lynchResult.playerTeam === 'MAFIA' ? 'red' : 'green' }}>
                    {' '}
                    {lynchResult.playerName} was a {lynchResult.playerRole}
                </h1>
            )}
            <div className='header'>
                <h3> Day {state.gameProgress.dayCount} </h3>
                <h3> {timer} s </h3>
            </div>

            <div className='players-table'>
                <table className='table'>
                    <thead>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>Player Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.players.length
                            ? state.players.map((p, i) => (
                                  <tr key={p.playerID}>
                                      <th scope='col'>#{i + 1}</th>
                                      <th scope='col'>{p.playerName} </th>
                                      <th>
                                          {voteStart && !voteFinished && (
                                              <button
                                                  disabled={voteDisabledHandler(p)}
                                                  onClick={() =>
                                                      socket.volatile.emit('vote-for', lobbyCode, state.myPlayer.playerID, p.playerID)
                                                  }
                                              >
                                                  Vote
                                              </button>
                                          )}
                                      </th>
                                      <th>{voteStart && <p>{votes.find((vote) => vote.playerID === p.playerID).voters.length}</p>}</th>
                                  </tr>
                              ))
                            : null}
                    </tbody>
                </table>
            </div>

            <div className='row'>
                <div className='col-6'>
                    <p> {description} </p>
                </div>
                <div className='col-6'>
                    <div className=''>{Svg}</div>
                </div>
            </div>
        </div>
    );
}
