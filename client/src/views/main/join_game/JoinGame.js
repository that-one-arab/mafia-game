import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from '../../../components';

const ERR_INPUT_PLAYER_NAME = {
    show: 1,
    header: 'Your player name cannot be empty',
    body: 'Your player name is used to identify you in the game, please input a name',
};

export default function JoinGame() {
    window.sessionStorage.clear();

    const history = useHistory();
    const [toast, setToast] = useState({
        show: 0,
        header: '',
        body: '',
    });

    const { playerName } = useSelector((state) => state.myPlayer);
    const dispatch = useDispatch();

    const dispatchPlayerNameHandler = (e) => dispatch({ type: 'SET_PLAYER_NAME', payload: e.target.value });

    const joinGameNextScreenHandler = () => {
        if (playerName.trim() === '') setToast({ ...ERR_INPUT_PLAYER_NAME, show: toast.show + 1 });
        else history.push('/join-game/enter-code');
    };

    return (
        <div>
            <Toaster toast={toast} setToast={setToast} />
            <div>
                <p>Please input your name</p>
                <input onChange={dispatchPlayerNameHandler} placeholder='name goes here' value={playerName} />
                <button onClick={joinGameNextScreenHandler}>Continue</button>
            </div>
        </div>
    );
}
