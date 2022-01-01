import { useState, useEffect, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { Svg } from '../../assets/svg';
import { useInterval } from '../../hooks';
import { initialState, reducer } from './reducer';
import './style.css';

function RoleAssignment() {
    return (
        <div>
            <h1>Hello role RoleAssignment</h1>
        </div>
    );
}

function Day() {
    return (
        <div>
            <h1>Day</h1>
        </div>
    );
}

function Night() {
    return (
        <div>
            <h1>Night</h1>
        </div>
    );
}

function Results(params) {
    return (
        <div>
            <h1>Results</h1>
        </div>
    );
}

/**
 * It needs to slide throw all images: (1, 2 , 3, 1, 2 ,3)
 * Once role is resolved, it needs to stop at the appropriate image
 */
function AutoSlider() {
    const els = [
        {
            label: 'Mafia',
            name: 'mafia',
            component: <Svg className={'svg slide-img'} svg='mafia' />,
        },
        {
            label: 'Doctor',
            name: 'doctor',
            component: <Svg className={'svg slide-img'} svg='doctor' />,
        },
        {
            label: 'Investigator',
            name: 'investigator',
            component: <Svg className={'svg slide-img'} svg='investigator' />,
        },
        {
            label: 'Villager',
            name: 'villager',
            component: <Svg className={'svg slide-img'} svg='villager' />,
        },
    ];

    const [slideIndex, setSlideIndex] = useState(0);

    useInterval(() => {
        if (slideIndex + 1 === els.length) setSlideIndex(0);
        else setSlideIndex(slideIndex + 1);
    }, 1000);

    return (
        <div>
            <div className='slideshow-container'>
                {els.map((el, i) => (
                    <div key={i} className={`${slideIndex === i ? 'mySlides-on' : 'mySlides-off'} fade`}>
                        {el.component}
                        <div className='text'>{el.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Controller({ socket, mainDispatch }) {
    const { lobby, gameOptions, myPlayer } = useSelector((state) => state);
    const { lobbyCode } = lobby;
    const { playersAmount } = gameOptions;

    console.log({ myPlayer });

    const [state, dispatch] = useReducer(reducer, initialState);
    console.log('state.players :', state && state.players && state.players);
    const { players } = state;

    /** Saves game and player neccassry info to session storage (garaunteed to run if player was pushed from lobby) */
    useEffect(() => {
        if (myPlayer.playerID && myPlayer.playerName && lobbyCode && playersAmount) {
            window.sessionStorage.setItem('player', JSON.stringify(myPlayer));
            window.sessionStorage.setItem('lobbyCode', lobbyCode);
            window.sessionStorage.setItem('gameOptions', JSON.stringify(gameOptions));
        }
    }, [myPlayer, lobbyCode, gameOptions, playersAmount]);

    /** Restores game and player neccassry info from session storage (in the case of a refresh or disconnection) */
    useEffect(() => {
        if (!myPlayer.playerID || !myPlayer.playerName || !lobbyCode || !playersAmount) {
            const player = JSON.parse(window.sessionStorage.getItem('player'));
            console.log('session storage player :', player);

            const lobbyCode = window.sessionStorage.getItem('lobbyCode');
            const ssGameOptions = JSON.parse(window.sessionStorage.getItem('gameOptions'));

            /** session storage actually returns string 'undefined' instead of type undefined that's why it's handled as string */
            if (player) {
                mainDispatch({ type: 'SET_PLAYER_ID', payload: player.playerID });
                mainDispatch({ type: 'SET_PLAYER_NAME', payload: player.playerName });
                player.isOwner && mainDispatch({ type: 'SET_ROOM_OWNER_TRUE' });
                mainDispatch({ type: 'SET_LOBBY_CODE', payload: lobbyCode });
                mainDispatch({ type: 'SET_PLAYERS_AMOUNT', payload: ssGameOptions.playersAmount });
            } else {
                console.warn('No player ID is was stored in session, needs handling');
            }
        }
    }, [myPlayer, mainDispatch, lobbyCode, playersAmount]);

    /** Fired once. attempts to join a player to a room, or if room doesnt exist; create and join a room */
    useEffect(() => {
        if (myPlayer.playerID && myPlayer.playerName && lobbyCode) {
            socket.emit('join-game', lobbyCode, myPlayer.playerID, myPlayer.playerName, (res) => {
                if (res.status !== 200) console.warn(res);
            });
        }
    }, [socket, lobbyCode, myPlayer]);

    /** Updates status of current players */
    useEffect(() => {
        socket.on('game-players', (res) => {
            console.log('GAME-PLAYERS :', res);

            dispatch({ type: 'SET_PLAYERS', payload: res.players });
        });
    }, [socket]);

    /** Fires the verify-room event, only if client is room owner. Server validates the room and it's players then
     * decides whether to respond with 'assigned-role' event or not */
    useEffect(() => {
        if (myPlayer.isOwner) {
            console.log('the player is the OWNER');
            if (playersAmount === players.length) {
                console.log('Players FULL, emitting!');
                socket.emit('verify-room', lobbyCode, myPlayer.playerID);
            }
        }
    }, [socket, lobbyCode, myPlayer, players, playersAmount]);

    /** Handles assigning role and team to client */
    useEffect(() => {
        socket.on('assigned-role', (player) => {
            console.log('assigned-role, player :', player);
        });
    }, [socket]);

    return (
        <div>
            <RoleAssignment />
            <AutoSlider />
        </div>
    );
}

export default function ControllerWrapper() {
    const [socket, setSocket] = useState(undefined);
    const dispatch = useDispatch();

    /** Socket initialization */
    useEffect(() => {
        const newSocket = io(`http://localhost:8080/game`, {
            transports: ['websocket'],
        });
        setSocket(newSocket);
        dispatch({ type: 'SET_CONNECTED_TO_TRUE' });

        return () => {
            dispatch({ type: 'SET_CONNECTED_TO_FALSE' });
            newSocket.close();
            console.log('disconnected socket...');
        };
    }, [setSocket, dispatch]);

    if (socket)
        return (
            <div>
                <Controller socket={socket} mainDispatch={dispatch} />
            </div>
        );
    else return null;
}
