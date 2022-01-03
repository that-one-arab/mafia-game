import { useState, useEffect, useReducer } from 'react';
import { useDispatch } from 'react-redux';
import io from 'socket.io-client';
import Day from './Day';
import Night from './Night';
import { initialState, reducer } from './reducer';
import RoleAssignment from './RoleAssignment';
import './style.css';

function Renderer({ socket, state, dispatch }) {
    const { isRoleAssigned, hasGameStarted, gamePhase } = state.gameProgress;
    if (isRoleAssigned && hasGameStarted && gamePhase === 'day') return <Day state={state} dispatch={dispatch} socket={socket} />;
    if (isRoleAssigned && hasGameStarted && gamePhase === 'night') return <Night state={state} dispatch={dispatch} socket={socket} />;
    else return <RoleAssignment state={state} dispatch={dispatch} socket={socket} />;
}

function Controller({ socket, state, dispatch }) {
    const myPlayer = JSON.parse(window.sessionStorage.getItem('global-myplayer'));
    const { playersAmount } = JSON.parse(window.sessionStorage.getItem('global-gameoptions'));
    const lobbyCode = window.sessionStorage.getItem('global-lobbycode');

    console.log('My Player global: ', myPlayer);
    console.log('Local State: ', state);

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
            socket.emit('get-game-props', lobbyCode, (res) => {
                console.log('get-game-props :', res);
                dispatch({
                    type: 'SET_GAME_PROGRESS',
                    payload: {
                        ...res.props,
                        isRoleAssigned: res.props.areRolesAssigned,
                    },
                });
            });
        }
    }, [socket, lobbyCode, state.gameProgress.isRoleAssigned, dispatch]);

    /** Updates status of current players */
    useEffect(() => {
        socket.on('game-players', (res) => {
            console.log('GAME-PLAYERS :', res);

            dispatch({ type: 'SET_PLAYERS', payload: res.players });
        });
    }, [socket, dispatch]);

    /** Fires the verify-room event, only if client is room owner. Server validates the room and it's players then
     * decides whether to respond with 'assigned-role' event or not */
    useEffect(() => {
        if (myPlayer.isOwner && !state.gameProgress.isRoleAssigned) {
            console.log('the player is the OWNER');
            if (playersAmount === state.players.length) {
                console.log('Players FULL, emitting!');
                socket.emit('verify-room', lobbyCode, myPlayer.playerID);
            }
        }
    }, [socket, lobbyCode, myPlayer, state.players, playersAmount, state.gameProgress.isRoleAssigned]);

    return <Renderer socket={socket} state={state} dispatch={dispatch} />;
}

export default function ControllerWrapper() {
    const [socket, setSocket] = useState(undefined);

    const [state, dispatch] = useReducer(reducer, initialState);

    const mainDispatch = useDispatch();

    /** Socket initialization */
    useEffect(() => {
        const newSocket = io(`http://localhost:8080/game`, {
            transports: ['websocket'],
        });
        setSocket(newSocket);
        mainDispatch({ type: 'SET_CONNECTED_TO_TRUE' });

        return () => {
            mainDispatch({ type: 'SET_CONNECTED_TO_FALSE' });
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
