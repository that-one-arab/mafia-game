/**
 * Day counter
 * Time counter
 * Players
 * Vote time
 */

import { useEffect, useState } from 'react';
import { gameEls } from '../../assets/svg';
import { useInterval } from '../../hooks';

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

    const [timer, setTimer] = useState(undefined);
    const [voteStart, setVoteStart] = useState(false);
    const [voteFinished, setVoteFinished] = useState(false);
    const [votes, setVotes] = useState(state.players.map((p) => ({ playerID: p.playerID, voters: [] })));
    const [lynchResult, setLynchResult] = useState(undefined);
    const [dayResult, setDayResult] = useState(undefined);

    useTimer({ timer, setTimer });

    useEffect(() => {
        socket.emit('moved-to', 'day', lobbyCode, state.myPlayer.playerID);
    }, [socket, lobbyCode, state.players, state.myPlayer.playerID]);

    useEffect(() => {
        socket.on('all-players-in-room', (room) => {
            if (room === 'day') {
                console.log('starting timer!');
                setTimer(10);
            }
        });

        socket.on('day-count', (count) => {
            console.log('day-count :', count);
            dispatch({ type: 'SET_DAY_COUNT', payload: count });
        });
    }, [socket, dispatch]);

    useEffect(() => {
        if (!voteStart && timer === 0 && state.gameProgress.dayCount !== 1) {
            setVoteStart(true);
            setTimer(15);
        } else if (!voteStart && timer === 0 && state.gameProgress.dayCount === 1) {
            setVoteFinished(true);
        }
    }, [voteStart, timer, state.gameProgress.dayCount, dispatch]);

    useEffect(() => {
        if (voteStart && !voteFinished && timer === 0 && state.myPlayer.isOwner) {
            socket.emit('vote-finished', lobbyCode);
        }
    }, [socket, voteStart, voteFinished, timer, state.myPlayer.isOwner, lobbyCode]);

    useEffect(() => {
        socket.on('vote-result', async (result) => {
            if (result) {
                setLynchResult({
                    playerName: result.playerName,
                    team: result.playerTeam,
                    role: result.playerRole,
                });

                await new Promise((r) => {
                    setTimeout(() => {
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
        socket.on('vote-start', () => {
            setVoteStart(true);
        });

        socket.on('votes', (votes) => {
            console.log('listened to votes :', votes);
            setVotes(votes);
        });
    }, [socket]);

    const { component: Svg, description } = getRoleSvgAndDescription(state.myPlayer.playerRole);

    return (
        <div>
            {dayResult && <h1>{dayResult}</h1>}
            {lynchResult && (
                <h1 style={{ color: lynchResult.team === 'mafia' ? 'red' : 'green' }}>
                    {' '}
                    {lynchResult.playerName} was a {lynchResult.role}
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

                                      {voteStart && (
                                          <>
                                              <th>
                                                  {' '}
                                                  <button
                                                      onClick={() =>
                                                          socket.volatile.emit('vote-for', lobbyCode, state.myPlayer.playerID, p.playerID)
                                                      }
                                                  >
                                                      Vote
                                                  </button>{' '}
                                              </th>
                                              <th>
                                                  <p>{votes.find((vote) => vote.playerID === p.playerID).voters.length}</p>
                                              </th>
                                          </>
                                      )}
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
