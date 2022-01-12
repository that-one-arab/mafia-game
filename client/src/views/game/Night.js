import React, { useEffect, useState } from 'react';
import { useInterval } from '../../hooks';
import { gameEls } from '../../assets/svg';
import { parseMafiaSelectButton, parseTownDisabled, parseTownDisabledClass } from './helpers';
import ActionResult from './ActionResult';
import GodfatherActionOn from '../../assets/img/6.png';

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
            <div className='game__table'>
                <div className='game__table--container'>
                    <table id='tab' className='table content-table-people'>
                        <thead>
                            <tr>
                                <th scope='col'>Name</th>
                                <th scope='col'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.length
                                ? players.map((p, i) => (
                                      <tr
                                          key={p.playerID}
                                          className={`${!p.playerAlive && 'dead-row'} ${
                                              p.playerID === state.myPlayer.playerID ? 'active-row' : ''
                                          }`}
                                      >
                                          <td>{p.playerName} </td>

                                          {actionStart && state.myPlayer.playerRole !== 'Townie' && (
                                              <td>
                                                  {' '}
                                                  <button
                                                      disabled={parseTownDisabled(state.myPlayer, p)}
                                                      className={`${parseTownDisabledClass(state.myPlayer, p)}  ${
                                                          p.actionOn && 'btn-choose-mafia'
                                                      }`}
                                                      onClick={() =>
                                                          socket.volatile.emit('action-on', lobbyCode, state.myPlayer.playerID, p.playerID)
                                                      }
                                                  >
                                                      Choose
                                                  </button>{' '}
                                              </td>
                                          )}
                                      </tr>
                                  ))
                                : null}
                        </tbody>
                    </table>
                </div>
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
    const handleMafiaDisabledClass = (player) => {
        if (myPlayer.playerRole === 'Goon') return 'btn-choose-mafia-disabled';

        if (!myPlayer.playerAlive) return 'btn-choose-mafia-disabled';

        if (!player.playerAlive) return 'btn-choose-mafia-disabled';

        if (player.playerTeam === 'MAFIA') return 'btn-choose-mafia-disabled';

        return 'btn-choose-mafia';
    };

    const handleMafiaDisabledButton = (player) => {
        if (myPlayer.playerRole === 'Goon') return true;

        if (!myPlayer.playerAlive) return true;

        if (!player.playerAlive) return true;

        if (player.playerTeam === 'MAFIA') return true;

        return false;
    };

    return (
        <div>
            <div className='game__table'>
                <div className='game__table--container'>
                    <table id='tab' className='table content-table-mafia'>
                        <thead>
                            <tr>
                                <th scope='col' style={{ width: '40%' }}>
                                    Name
                                </th>
                                <th scope='col' style={{ width: '10%' }}></th>
                                <th></th>
                                <th scope='col' style={{ width: '15%' }}>
                                    Total
                                </th>
                                <th scope='col' style={{ width: '20%' }}>
                                    Confirmed
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.length
                                ? players.map((p, i) => (
                                      <tr
                                          key={p.playerID}
                                          className={`${!p.playerAlive && 'dead-row'} ${
                                              p.playerID === myPlayer.playerID ? 'active-row' : ''
                                          }`}
                                      >
                                          <td style={{ color: p.playerTeam === 'MAFIA' ? 'red' : 'black' }}>
                                              {p.playerRole ? p.playerName + ' (' + p.playerRole + ')' : p.playerName}{' '}
                                          </td>
                                          <td>
                                              {actionStart && (
                                                  <button
                                                      className={`${handleMafiaDisabledClass(p)} ${parseMafiaSelectButton(p)}`}
                                                      onClick={() =>
                                                          socket.volatile.emit('action-on', lobbyCode, myPlayer.playerID, p.playerID)
                                                      }
                                                      disabled={handleMafiaDisabledButton(p)}
                                                  >
                                                      Choose
                                                  </button>
                                              )}
                                          </td>
                                          <td></td>
                                          <td>{actionStart && <p style={{ color: 'red' }}>{p.actionTotal ? p.actionTotal : 0}</p>}</td>
                                          <td>
                                              {actionStart && p.godfatherActionOn && (
                                                  <div className='img-box'>
                                                      <img src={GodfatherActionOn} alt='icon' className='img-icon' />
                                                  </div>
                                              )}
                                          </td>
                                      </tr>
                                  ))
                                : null}
                        </tbody>
                    </table>
                </div>
            </div>
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

    return <MafiaTable socket={socket} players={players} lobbyCode={lobbyCode} myPlayer={state.myPlayer} actionStart={actionStart} />;
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
                        setTimer(20);
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
        <section className='game night'>
            <div className='game__info'>
                <p className='game__info-day'>Night </p>
                <p className='game__info-time'>Time {timer}s </p>
            </div>

            {actionResult && <ActionResult actionResult={actionResult} />}

            {state.myPlayer.playerTeam === 'MAFIA' ? (
                <MafiaUI state={state} socket={socket} lobbyCode={lobbyCode} actionStart={actionStart} />
            ) : (
                <TownUI state={state} socket={socket} lobbyCode={lobbyCode} actionStart={actionStart} />
            )}

            <div className='result'>
                <div className='result__container'>
                    <div className='status'>
                        <p className='role'>{description}</p>
                        <p> {actionCountHandler(state.myPlayer)} </p>
                        <br />
                    </div>
                    <div className='stat__box'>
                        <div className='stat__box--icon'> {Svg} </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
