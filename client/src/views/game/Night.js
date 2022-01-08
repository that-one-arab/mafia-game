import React, { useEffect, useState } from 'react';
import { useInterval } from '../../hooks';
import { gameEls } from '../../assets/svg';
import { parseMafiaSelectButton, parseTownDisabled } from './helpers';
import ActionResult from './ActionResult';

function getRoleSvgAndDescription(playerRole) {
    const { component, description } = gameEls.find((el) => el.name === playerRole);

    return { component, description };
}

function useTimer({ timer, setTimer }) {
    useInterval(() => {
        timer && setTimer((prevVal) => prevVal - 1);
    }, 1000);
}

/**
 * Once timer ends, STOP allowing players to choose actions
 * After that, display results of action
 * If player dies, do not display result of action, instead display DEATH
 * After display timeout has ended (4 seconds), Transition to DAY
 */

function TownUI({ state, actionStart, socket, lobbyCode }) {
    const [players, setPlayers] = useState(state.players.map((p) => ({ ...p, actionSelected: false })));

    useEffect(() => {
        socket.on('action-confirmed', (players) => {
            setPlayers(players);
        });
    }, [socket]);

    return (
        <div>
            <p>Town UI</p>
            <div className='players-table'>
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
                                  <tr key={p.playerID}>
                                      <th scope='col'>#{i + 1}</th>
                                      <th scope='col'>{p.playerName} </th>

                                      {actionStart && state.myPlayer.playerRole !== 'Townie' && (
                                          <>
                                              <th>
                                                  {' '}
                                                  <button
                                                      disabled={parseTownDisabled(state.myPlayer, p)}
                                                      className={`btn ${p.actionOn ? 'btn-warning' : 'btn-primary'}`}
                                                      onClick={() =>
                                                          socket.volatile.emit('action-on', lobbyCode, state.myPlayer.playerID, p.playerID)
                                                      }
                                                  >
                                                      Choose
                                                  </button>{' '}
                                              </th>
                                              <th>{/* <p>{votes.find((vote) => vote.playerID === p.playerID).voters.length}</p> */}</th>
                                          </>
                                      )}
                                  </tr>
                              ))
                            : null}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Display the other mafia players by highlighting their rows in red, DONE
 * Display other mafia players selections DONE
 * Once timer ends, STOP allowing players to choose actions
 * After that, display results of action
 * If player dies, do not display result of action, instead display DEATH
 * After display timeout has ended (4 seconds), Transition to DAY
 */

const MafiaTable = React.memo(function MafiaTable({ socket, players, actionStart, myPlayer, lobbyCode }) {
    const handleMafiaDisabled = (player) => {
        if (!myPlayer.playerAlive) return true;

        if (!player.playerAlive) return true;

        if (player.playerTeam === 'MAFIA') return true;

        return false;
    };

    return (
        <div className='players-table'>
            <table className='table'>
                <thead>
                    <tr>
                        <th scope='col'>#</th>
                        <th scope='col'>Player Name</th>
                    </tr>
                </thead>
                <tbody>
                    {players.length
                        ? players.map((p, i) => {
                              return (
                                  <tr key={p.playerID} style={{ color: p.playerTeam === 'MAFIA' ? 'red' : '' }}>
                                      <th scope='col'>#{i + 1}</th>
                                      <th scope='col'>{p.playerRole ? p.playerName + ' (' + p.playerRole + ')' : p.playerName} </th>

                                      {actionStart && (
                                          <>
                                              <th>
                                                  {' '}
                                                  <button
                                                      className={`btn ${parseMafiaSelectButton(p)}`}
                                                      onClick={() =>
                                                          socket.volatile.emit('action-on', lobbyCode, myPlayer.playerID, p.playerID)
                                                      }
                                                      disabled={handleMafiaDisabled(p)}
                                                  >
                                                      Choose
                                                  </button>{' '}
                                              </th>
                                              <th>
                                                  <p style={{ color: 'red' }}>
                                                      {p.actionTotal ? p.actionTotal + ' Selections' : 'No Selection'}
                                                  </p>
                                              </th>
                                              <th>
                                                  <p> {p.godfatherActionOn && 'Definite kill'} </p>
                                              </th>
                                          </>
                                      )}
                                  </tr>
                              );
                          })
                        : null}
                </tbody>
            </table>
        </div>
    );
});

function MafiaUI({ state, actionStart, socket, lobbyCode }) {
    const [players, setPlayers] = useState(state.players.map((p) => ({ ...p, actionSelected: false })));

    useEffect(() => {
        socket.on('action-confirmed', (players) => {
            let mafiaParsedPlayers = players.map((player) => ({
                ...player,
                myActionOn: false,
                godfatherActionOn: false,
                escortActionOn: false,
                actionTotal: 0,
            }));

            players.forEach((player) => {
                if (player.actionOn) {
                    if (player.playerRole === 'Godfather') {
                        const pIndex = mafiaParsedPlayers.findIndex((p) => p.playerID === player.actionOn);
                        mafiaParsedPlayers[pIndex].godfatherActionOn = true;
                        mafiaParsedPlayers[pIndex].actionTotal = mafiaParsedPlayers[pIndex].actionTotal + 1;

                        if (player.playerID === state.myPlayer.playerID) {
                            mafiaParsedPlayers[pIndex].myActionOn = true;
                        }
                    } else if (player.playerRole === 'Escort') {
                        const pIndex = mafiaParsedPlayers.findIndex((p) => p.playerID === player.actionOn);
                        mafiaParsedPlayers[pIndex].escortActionOn = true;
                        mafiaParsedPlayers[pIndex].actionTotal = mafiaParsedPlayers[pIndex].actionTotal + 1;

                        if (player.playerID === state.myPlayer.playerID) {
                            mafiaParsedPlayers[pIndex].myActionOn = true;
                        }
                    } else {
                        const pIndex = mafiaParsedPlayers.findIndex((p) => p.playerID === player.actionOn);
                        mafiaParsedPlayers[pIndex].actionTotal = mafiaParsedPlayers[pIndex].actionTotal + 1;

                        if (player.playerID === state.myPlayer.playerID) {
                            mafiaParsedPlayers[pIndex].myActionOn = true;
                        }
                    }
                }
            });

            setPlayers(mafiaParsedPlayers);
        });
    }, [socket, state.myPlayer.playerID]);

    return (
        <div>
            <p>Mafia UI</p>
            <MafiaTable socket={socket} players={players} lobbyCode={lobbyCode} myPlayer={state.myPlayer} actionStart={actionStart} />
        </div>
    );
}

const actionCountHandler = (myPlayer) => {
    if (typeof myPlayer.actionCount === 'number') {
        return `Remaining actions: ${myPlayer.actionCount}`;
    }
};

export default function Night({ socket, state, dispatch }) {
    const lobbyCode = window.sessionStorage.getItem('global-lobbycode');

    const [timer, setTimer] = useState(undefined);

    const [actionStart, setActionStart] = useState(false);

    const [actionResult, setActionResult] = useState(undefined);

    useTimer({ timer, setTimer });

    useEffect(() => {
        socket.emit('moved-to', 'night', lobbyCode, state.myPlayer.playerID);
    }, [socket, lobbyCode, state.players, state.myPlayer.playerID]);

    useEffect(() => {
        socket.on('all-players-in-room', async (room) => {
            if (room === 'night') {
                await new Promise((r) =>
                    setTimeout(() => {
                        setActionStart(true);
                        setTimer(35);
                        r();
                    }, 3000)
                );
            }
        });
    }, [socket]);

    useEffect(() => {
        if (timer === 0 && state.myPlayer.isOwner) {
            socket.emit('action-finished', lobbyCode);
        }
    }, [socket, timer, state.myPlayer.isOwner, lobbyCode]);

    useEffect(() => {
        socket.on('action-stop', () => {
            setActionStart(false);
        });
    }, [socket]);

    useEffect(() => {
        socket.on('action-result', async (result) => {
            console.log('listened to action-result :', result);
            setActionResult(result);

            if (state.myPlayer.isOwner) {
                await new Promise((r) => {
                    setTimeout(() => {
                        socket.emit('transition-ready', lobbyCode, state.myPlayer.playerID);
                    }, 5000);
                });
            }
        });
    }, [socket, state.myPlayer.isOwner, state.myPlayer.playerID, lobbyCode]);

    useEffect(() => {
        socket.on('transition-to', (to) => {
            dispatch({ type: 'TRANSITION_TO', payload: to });
        });
    }, [socket, dispatch]);

    const { component: Svg, description } = getRoleSvgAndDescription(state.myPlayer.playerRole);

    return (
        <div>
            <div className='header'>
                <h3> Night </h3>
                <h3> {timer} s </h3>
            </div>

            {actionResult && <ActionResult actionResult={actionResult} />}

            {state.myPlayer.playerTeam === 'MAFIA' ? (
                <MafiaUI state={state} socket={socket} lobbyCode={lobbyCode} actionStart={actionStart} />
            ) : (
                <TownUI state={state} socket={socket} lobbyCode={lobbyCode} actionStart={actionStart} />
            )}

            <div className='row'>
                <div className='col-6'>
                    <p>{description}</p>
                    <p> {actionCountHandler(state.myPlayer)} </p>
                </div>
                <div className='col-6'>
                    <div className=''>{Svg}</div>
                </div>
            </div>
        </div>
    );
}
