import { useEffect, useState } from 'react';
import { els } from '../../assets/svg';
import { useInterval } from '../../hooks';

function Slider({ slideInterval, playerRole, setRoleAssigned }) {
    const [slideIndex, setSlideIndex] = useState(0);

    useInterval(() => {
        if (playerRole) {
            if (els[slideIndex].name === playerRole) {
                setSlideIndex(slideIndex);
                setRoleAssigned(true);
            } else if (slideIndex + 1 === els.length) setSlideIndex(0);
            else setSlideIndex(slideIndex + 1);
        } else {
            if (slideIndex + 1 === els.length) setSlideIndex(0);
            else setSlideIndex(slideIndex + 1);
        }
    }, slideInterval);

    return (
        <div className='slideshow-container'>
            {els.map((el, i) => (
                <div key={i} className={`${slideIndex === i ? 'mySlides-on' : 'mySlides-off'} `}>
                    {el.component}
                    <div className='name'>{el.name}</div>
                    <p className='description'>{el.name === playerRole && el.description}</p>
                </div>
            ))}
        </div>
    );
}

export default function RoleAssignment({ state, dispatch, socket }) {
    const [slideInterval, setSlideInterval] = useState(50);
    const [roleAssigned, setRoleAssigned] = useState(false);

    useEffect(() => {
        if (roleAssigned) {
            setTimeout(() => {
                window.sessionStorage.setItem(
                    'local-gameprogress',
                    JSON.stringify({
                        ...JSON.parse(window.sessionStorage.getItem('local-gameprogress')),
                        isRoleAssigned: true,
                    })
                );

                dispatch({ type: 'ROLE_ASSIGNED' });
            }, 3000);
        }
    }, [roleAssigned, dispatch]);

    useInterval(() => {
        if (slideInterval !== 230) setSlideInterval((prevVal) => prevVal + 30);
    }, [2000]);

    /** Handles assigning role and team to client */
    useEffect(() => {
        socket.on('assigned-role', (player) => {
            // console.group('assigned-role');

            setTimeout(() => {
                // console.log('dispatching SET_PLAYER with obj: ', player);
                dispatch({ type: 'SET_PLAYER', payload: player });

                window.sessionStorage.setItem('local-player', JSON.stringify(player));
            }, 5000);

            // console.groupEnd('assigned-role');
        });
    }, [socket, dispatch]);

    return (
        <div className='input_create_game'>
            <Slider
                slideInterval={slideInterval}
                playerRole={state.myPlayer.playerRole ? state.myPlayer.playerRole : undefined}
                setRoleAssigned={setRoleAssigned}
            />
        </div>
    );
}
