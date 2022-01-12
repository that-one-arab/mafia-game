import { useState, useEffect, useReducer } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import io from 'socket.io-client';
import { WEBSOCKET_ENDPOINT } from '../../global';
import { useInterval } from '../../hooks';
import Day from './Day';
import GameResult from './GameResult';
import Night from './Night';
import { initialState, reducer } from './reducer';
import RoleAssignment from './RoleAssignment';
import { DisconnectionLoading } from '../../components/';
import './style.css';

function useTimer(timer, setTimer) {
    useInterval(() => {
        timer && setTimer((prevVal) => prevVal - 1);
    }, 1000);
}

function RendererWrapper({ socket, state, dispatch, timer, setPausedTimer }) {
    return (
        <DisconnectionLoading loading={state.gameProgress.gamePaused} time={timer}>
            <Renderer socket={socket} state={state} dispatch={dispatch} setPausedTimer={setPausedTimer} />
        </DisconnectionLoading>
    );
}

function Renderer({ socket, state, dispatch, setPausedTimer }) {
    const { isRoleAssigned, hasGameStarted, gamePhase } = state.gameProgress;
    if (state.gameEnded) return <GameResult winnerTeam={state.gameEnded.winner} players={state.gameEnded.players} />;
    else if (isRoleAssigned && hasGameStarted && gamePhase === 'day') {
        return <Day state={state} dispatch={dispatch} socket={socket} setPausedTimer={setPausedTimer} />;
    } else if (isRoleAssigned && hasGameStarted && gamePhase === 'night') {
        return <Night state={state} dispatch={dispatch} socket={socket} setPausedTimer={setPausedTimer} />;
    } else return <RoleAssignment state={state} dispatch={dispatch} socket={socket} />;
}

function Controller({ socket, state, dispatch }) {
    const history = useHistory();

    const [timer, setTimer] = useState(undefined);

    useTimer(timer, setTimer);

    const myPlayer = JSON.parse(window.sessionStorage.getItem('global-myplayer'));
    const { playersAmount } = JSON.parse(window.sessionStorage.getItem('global-gameoptions'));
    const lobbyCode = window.sessionStorage.getItem('global-lobbycode');

    /** Fired once. attempts to join a player to a room, or if room doesnt exist; create and join a room */
    useEffect(() => {
        socket.emit('join-game', lobbyCode, myPlayer.playerID, myPlayer.playerName, (res) => {
            if (res.status !== 200) console.warn(res);

            window.sessionStorage.setItem(
                'local-gameProgress',
                JSON.stringify({
                    ...JSON.parse(window.sessionStorage.getItem('local-gameprogress')),
                    hasJoinedGameRoom: true,
                })
            );

            if (res.message.includes('Roles are already assigned')) {
                dispatch({ type: 'ROLE_ASSIGNED' });
            }
        });
    }, [socket, lobbyCode, myPlayer.playerID, myPlayer.playerName, dispatch]);

    useEffect(() => {
        if (state.gameProgress.isRoleAssigned) {
            socket.emit('get-game-props', lobbyCode, state.myPlayer.playerID, (res) => {
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
            });
        }
    }, [socket, lobbyCode, state.gameProgress.isRoleAssigned, state.myPlayer.playerID, dispatch]);

    /** Updates status of current players */
    useEffect(() => {
        socket.on('game-players', (res) => {
            dispatch({ type: 'SET_PLAYERS', payload: res.players });
            const myPlayer = res.players.find((p) => p.playerID === state.myPlayer.playerID);
            if (myPlayer) {
                let playerDispatch = {};
                for (const key in myPlayer) {
                    if (Object.hasOwnProperty.call(myPlayer, key)) {
                        if (typeof myPlayer[key] === 'boolean') {
                            playerDispatch = {
                                ...playerDispatch,
                                [key]: myPlayer[key],
                            };
                        } else if (myPlayer[key]) {
                            playerDispatch = {
                                ...playerDispatch,
                                [key]: myPlayer[key],
                            };
                        }
                    }
                }
                delete playerDispatch.playerID;
                dispatch({ type: 'SET_PLAYER', payload: playerDispatch });
            }
        });
    }, [socket, dispatch, state.myPlayer.playerID]);

    useEffect(() => {
        if (typeof timer === 'number' && timer === 0) {
            history.push('/');
        }
    }, [timer, history]);

    /** Fires the verify-room event, only if client is room owner. Server validates the room and it's players then
     * decides whether to respond with 'assigned-role' event or not */
    useEffect(() => {
        if (myPlayer.isOwner && !state.gameProgress.isRoleAssigned) {
            if (playersAmount === state.players.length) {
                socket.emit('verify-room', lobbyCode, myPlayer.playerID);
            }
        }
    }, [socket, lobbyCode, myPlayer, state.players, playersAmount, state.gameProgress.isRoleAssigned]);

    return <RendererWrapper socket={socket} state={state} dispatch={dispatch} timer={timer} setPausedTimer={setTimer} />;
}

export default function ControllerWrapper() {
    const [socket, setSocket] = useState(undefined);

    const [state, dispatch] = useReducer(reducer, initialState);

    const mainDispatch = useDispatch();

    /** Socket initialization */
    useEffect(() => {
        const newSocket = io(`${WEBSOCKET_ENDPOINT}/game`, {
            transports: ['websocket'],
        });
        setSocket(newSocket);
        mainDispatch({ type: 'SET_CONNECTED_TO_TRUE' });

        return () => {
            mainDispatch({ type: 'SET_CONNECTED_TO_FALSE' });
            newSocket.removeAllListeners();
            newSocket.close();
            console.log('disconnected socket...');
        };
    }, [setSocket, mainDispatch]);

    /** Restores game and player neccassry info from session storage TO LOCAL STORE (in the case of a refresh or disconnection) */
    useEffect(() => {
        if (window.sessionStorage.getItem('local-player')) {
            dispatch({ type: 'SET_PLAYER', payload: JSON.parse(window.sessionStorage.getItem('local-player')) });
        } else {
            window.sessionStorage.setItem(
                'local-player',
                JSON.stringify({
                    ...initialState.myPlayer,
                })
            );
        }

        if (window.sessionStorage.getItem('local-gameprogress')) {
            dispatch({ type: 'SET_GAME_PROGRESS', payload: JSON.parse(window.sessionStorage.getItem('local-gameprogress')) });
        } else {
            window.sessionStorage.setItem(
                'local-gameprogress',
                JSON.stringify({
                    ...initialState.gameProgress,
                })
            );
        }
    }, []);

    if (socket)
        return (
            <div>
                <Controller socket={socket} dispatch={dispatch} state={state} />
            </div>
        );
    else return null;
}
