import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';

const ERR_INPUT_PLAYER_NAME = {
    show: 1,
    header: 'Your player name cannot be empty',
    body: 'Your player name is used to identify you in the game, please input a name',
};

export default function JoinGame() {
    window.sessionStorage.clear();

    const history = useHistory();

    const { playerName } = useSelector((state) => state.myPlayer);
    const dispatch = useDispatch();

    const dispatchPlayerNameHandler = (e) => dispatch({ type: 'SET_PLAYER_NAME', payload: e.target.value });

    const joinGameNextScreenHandler = () => {
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
        else history.push('/join-game/enter-code');
    };

    return (
        <div>
            <div className='input_create_game'>
                <div className='input_fields'>
                    <div action='#' className='form'>
                        <div className='form__grup'>
                            <label htmlFor='name' className='form__label'>
                                Enter your player name
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
                            <div className='Continuo_btn_box'>
                                <button onClick={joinGameNextScreenHandler} className='btnbox_btn--animation btn-Continuo'>
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
