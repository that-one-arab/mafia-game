import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { Loading } from '../../../components';
import { ToastContainer, toast } from 'react-toastify';

export default function CreateGame() {
    window.sessionStorage.clear();

    const history = useHistory();
    const dispatch = useDispatch();
    const playersAmount = useSelector((state) => state.gameOptions.playersAmount);
    const playerName = useSelector((state) => state.myPlayer.playerName);

    const [loading, setLoading] = useState(false);

    const dispatchPlayerAmountHandler = (e) =>
        dispatch({
            type: 'SET_PLAYERS_AMOUNT',
            payload: Number(e.target.value),
        });

    const dispatchPlayerNameHandler = (e) => dispatch({ type: 'SET_PLAYER_NAME', payload: e.target.value });

    const createRoomHandler = async () => {
        setLoading(true);
        const res = await fetch('/api/lobby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerName,
                playersAmount,
            }),
        });

        setLoading(false);

        if (res.status === 201) {
            const data = await res.json();
            console.log({ data });
            dispatch({ type: 'SET_LOBBY_CODE', payload: data.lobbyCode });
            dispatch({ type: 'SET_PLAYER_ID', payload: data.playerID });
            dispatch({ type: 'SET_ROOM_OWNER_TRUE' });

            history.push('/lobby');
        }
    };

    const createGameNextScreenHandler = async () => {
        if (playerName.trim() === '')
            toast.warn('Your player name is used to identify you in the game, please enter a name', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        else if (playersAmount === 0)
            toast.warn('Please select amount of players for the game', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        else await createRoomHandler();
    };

    return (
        <div>
            <Loading absolute loading={loading}>
                <div className='input_create_game'>
                    <div className='input_fields'>
                        <div action='#' className='form'>
                            <div className='form__grup'>
                                <label htmlFor='name' className='form__label'>
                                    Enter your player Name
                                </label>
                                <input
                                    onChange={dispatchPlayerNameHandler}
                                    placeholder='Player Name'
                                    value={playerName}
                                    type='text'
                                    className='form__input'
                                    id='name'
                                    required
                                />
                            </div>
                            <div className='form__grup'>
                                <label htmlFor='name' className='form__label'>
                                    Enter amount of players
                                </label>
                                <input
                                    placeholder='(min: 4)'
                                    value={playersAmount}
                                    min='4'
                                    type='number'
                                    onChange={dispatchPlayerAmountHandler}
                                    className='form__input'
                                    id='Amount of Players'
                                    required
                                />
                            </div>
                            <div className='form__grup'>
                                <div className='Continuo_btn_box'>
                                    <button className='btnbox_btn--animation btn-Continuo' onClick={createGameNextScreenHandler}>
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
