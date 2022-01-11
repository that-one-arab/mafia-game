import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Loading } from '../../../components';
import { ToastContainer, toast } from 'react-toastify';

const ERR_ENTER_GAME_CODE = {
    show: 1,
    header: 'No game code was entered',
    body: 'Please enter a game code',
};

const ERR_GAME_CODE_TOO_LONG = {
    show: 1,
    header: 'Your game code is invalid',
    body: 'Your game code cannot be longer than 6, please double check your game code and try again',
};

const ERR_NO_PLAYER_NAME = {
    show: 1,
    header: 'Your player name cannot be empty',
    body: 'Your player name is used to identify you in the game, please go back to the first screen and input a name',
};

const ERR_GAME_CODE_INVALID = {
    show: 1,
    header: 'Invalid game code',
    body: 'Your game code is invalid. Please double check your game code and try again',
};

const ERR_ROOM_FULL = {
    show: 1,
    header: 'Room full',
    body: 'This room is full, please check with the lobby owner',
};

const ERR_LOBBY_OWNER_LEFT = {
    show: 1,
    header: 'Room owner left',
    body: 'The lobby owner has left the room',
};

// A custom hook that builds on useLocation to parse
// the query string for you.
function useQuery() {
    const { search } = useLocation();

    return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function JoinGameEnterCode() {
    const history = useHistory();
    const dispatch = useDispatch();
    const query = useQuery();

    const [gameCode, setGameCode] = useState('');
    const [loading, setLoading] = useState(false);

    const { playerName } = useSelector((state) => state.myPlayer);

    const setGameCodeHandler = (e) => setGameCode(e.target.value);

    const getGameWithCodeHandler = async () => {
        setLoading(true);

        const res = await fetch(`/api/lobby?lobbyCode=${gameCode}`);
        setLoading(false);
        if (res.status === 200) {
            dispatch({
                type: 'SET_LOBBY_CODE',
                payload: gameCode,
            });
            dispatch({ type: 'SET_ROOM_OWNER_FALSE' });

            history.push('/lobby');
        } else {
            toast.warn('Your game code is invalid. Please double check your game code and try again', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        }
    };

    const joinGameEnterCodeContinueHandler = async () => {
        if (gameCode.trim() === '')
            toast.warn('Please enter a game code', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        else if (gameCode.trim().length > 6)
            toast.warn('Your game code cannot be longer than 6, please double check your game code and try again', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        else if (playerName.trim() === '')
            toast.warn('Your player name is used to identify you in the game, please go back to the first screen and input a name', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        else await getGameWithCodeHandler();
    };

    /** This would fire if: player joins a lobby; lobby is already full; lobby route pushed player back to join-game-enter-code route and adds a ?joinStatus=room-full query param */
    useEffect(() => {
        const joinStatus = query.get('joinStatus');
        if (joinStatus === 'room-full') {
            toast.warn('This room is full, please check with the lobby owner', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        } else if (joinStatus === 'lobby-owner-exited') {
            toast.warn('The lobby owner has left the room', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        }
    }, [query]);

    return (
        <div>
            <Loading absolute loading={loading}>
                <div className='input_create_game'>
                    <div className='input_fields'>
                        <div action='#' className='form'>
                            <div className='form__grup'>
                                <label htmlFor='gamecode' className='form__label'>
                                    Enter room's game code
                                </label>
                                <input onChange={setGameCodeHandler} value={gameCode} className='form__input' id='gamecode' />
                            </div>
                            <div className='form__grup'>
                                <div className='Continuo_btn_box'>
                                    <button className='btnbox_btn--animation btn-Continuo' onClick={joinGameEnterCodeContinueHandler}>
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Loading>
            <ToastContainer
                position='top-center'
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                draggable
                pauseOnHover
                pauseOnFocusLoss={false}
            />
        </div>
    );
}
