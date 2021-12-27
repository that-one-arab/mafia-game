import { useState, useEffect, useReducer } from 'react';
import { useSelector } from 'react-redux';
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
                    <div
                        key={i}
                        className={`${
                            slideIndex === i ? 'mySlides-on' : 'mySlides-off'
                        } fade`}
                    >
                        {el.component}
                        <div className='text'>{el.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Controller({ socket }) {
    const { lobby, gameOptions, myPlayer } = useSelector((state) => state);
    const { lobbyCode, players } = lobby;
    const { playersAmount } = gameOptions;

    const [state, dispatch] = useReducer(reducer, initialState);
    console.log('state.players :', state.players);

    useEffect(() => {
        socket.emit(
            'join-game',
            lobbyCode,
            myPlayer.playerID,
            myPlayer.playerName,
            (res) => {
                if (res.status !== 200) console.warn(res);
            }
        );
    }, [socket, lobbyCode, myPlayer]);

    useEffect(() => {
        socket.on('game-players', (res) => {
            console.log('game-players listened :', res);

            dispatch({ type: 'SET_PLAYERS', payload: res.players });
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

    /** Socket initialization */
    useEffect(() => {
        const newSocket = io(`http://localhost:8080/game`, {
            transports: ['websocket'],
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, [setSocket]);

    if (socket)
        return (
            <div>
                <Controller socket={socket} />
            </div>
        );
    else return null;
}
