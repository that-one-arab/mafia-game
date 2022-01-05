import React, { useEffect, useState } from 'react';
import { useInterval } from '../../hooks';
import { gameEls } from '../../assets/svg';
import { parseMafiaSelectButton, parseTownDisabled } from './helpers';

function getRoleSvgAndDescription(playerRole) {
    const { component, description } = gameEls.find((el) => el.name === playerRole);

    return { component, description };
}

function useTimer({ timer, setTimer }) {
    useInterval(() => {
        timer && setTimer((prevVal) => prevVal - 1);
    }, 1000);
}

const resultTemplate = {
    code: 'death | healed | killed | investigated | blocked',
};

/**
 * Once timer ends, STOP allowing players to choose actions
 * After that, display results of action
 * If player dies, do not display result of action, instead display DEATH
 * After display timeout has ended (4 seconds), Transition to DAY
 */

function TownUI({ state, actionStart, socket, lobbyCode }) {
    const [players, setPlayers] = useState(state.players.map((p) => ({ ...p, actionSelected: false })));

    useEffect(() => {
        console.log('Recieved initial players from state: ', state.players);
    }, [state.players]);

    useEffect(() => {
        socket.on('action-confirmed', (players) => {
            console.log('recieved action-confirmed, players :', players);

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
 * Display the other mafia players by highlighting their rows in red,
 * Display other mafia players selections
 * Once timer ends, STOP allowing players to choose actions
 * After that, display results of action
 * If player dies, do not display result of action, instead display DEATH
 * After display timeout has ended (4 seconds), Transition to DAY
 */

const MafiaTable = React.memo(function MafiaTable({ socket, players, actionStart, myPlayerID, lobbyCode }) {
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
                              console.log('Looping through player: ', p);
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
                                                      onClick={() => socket.volatile.emit('action-on', lobbyCode, myPlayerID, p.playerID)}
                                                      disabled={p.playerTeam === 'MAFIA' ? true : false}
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
            console.log('listened to action-confirmed, players :', players);

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

            console.log('parsed :', mafiaParsedPlayers);

            setPlayers(mafiaParsedPlayers);
        });
    }, [socket, state.myPlayer.playerID]);

    return (
        <div>
            <p>Mafia UI</p>
            <MafiaTable
                socket={socket}
                players={players}
                lobbyCode={lobbyCode}
                myPlayerID={state.myPlayer.playerID}
                actionStart={actionStart}
            />
        </div>
    );
}

const parseDescription = (description, myPlayer) => {
    if (typeof myPlayer.actionCount === 'number') {
        return `${description}\nRemaining actions: ${myPlayer.actionCount}`;
    }
    return description;
};

export default function Night({ socket, state, dispatch }) {
    const lobbyCode = window.sessionStorage.getItem('global-lobbycode');

    const [timer, setTimer] = useState(undefined);

    const [actionStart, setActionStart] = useState(false);
    const [actionFinished, setActionFinished] = useState(false);

    const [actionResult, setActionResult] = useState(undefined);

    actionStart && console.log('actionStart :', actionStart);
    actionFinished && console.log('actionFinished: ', actionFinished);
    actionResult && console.log('actionResult :', actionResult);

    useTimer({ timer, setTimer });

    useEffect(() => {
        console.log('fired moved-to: night event with values (lobbyCode, playerID) :', lobbyCode, state.myPlayer.playerID);
        socket.emit('moved-to', 'night', lobbyCode, state.myPlayer.playerID);
    }, [socket, lobbyCode, state.players, state.myPlayer.playerID]);

    useEffect(() => {
        socket.on('all-players-in-room', async (room) => {
            console.log('recieved all-players-in-room with room :', room);
            if (room === 'night') {
                await new Promise((r) =>
                    setTimeout(() => {
                        console.log('starting timer!');
                        setActionStart(true);
                        setTimer(1000);
                        r();
                    }, 3000)
                );
            }
        });
    }, [socket]);

    useEffect(() => {
        if (timer === 0 && state.myPlayer.isOwner) {
            console.log('player is owner, emitting action-finished with lobbyCode :', lobbyCode);
            socket.emit('action-finised', lobbyCode);
        }
    }, [socket, timer, state.myPlayer.isOwner, lobbyCode]);

    useEffect(() => {
        socket.on('night-result', (result) => {
            console.log('night-result :', result);
        });
    }, [socket]);

    const { component: Svg, description } = getRoleSvgAndDescription(state.myPlayer.playerRole);

    return (
        <div>
            <div className='header'>
                <h3> Night </h3>
                <h3> {timer} s </h3>
            </div>

            {actionResult && <h3> {actionResult.message} </h3>}

            {state.myPlayer.playerTeam === 'MAFIA' ? (
                <MafiaUI state={state} socket={socket} lobbyCode={lobbyCode} actionStart={actionStart} />
            ) : (
                <TownUI state={state} socket={socket} lobbyCode={lobbyCode} actionStart={actionStart} />
            )}

            <div className='row'>
                <div className='col-6'>
                    <p> {parseDescription(description, state.myPlayer)} </p>
                </div>
                <div className='col-6'>
                    <div className=''>{Svg}</div>
                </div>
            </div>
        </div>
    );
}
