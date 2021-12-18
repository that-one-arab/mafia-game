import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from '../../../components';

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
    show: true,
    header: 'Your player name cannot be empty',
    body: 'Your player name is used to identify you in the game, please go back to the first screen and input a name',
};

export default function JoinGameEnterCode() {
    const history = useHistory();
    const [gameCode, setGameCode] = useState('');
    const [toast, setToast] = useState({ show: 0, header: '', body: '' });
    const playerName = useSelector((state) => state.player.name);

    const setGameCodeHandler = (e) => setGameCode(e.target.value);

    const joinGameEnterCodeContinueHandler = () => {
        if (gameCode.trim() === '')
            setToast({ ...ERR_ENTER_GAME_CODE, show: toast.show + 1 });
        else if (gameCode.trim().length > 6)
            setToast({ ...ERR_GAME_CODE_TOO_LONG, show: toast.show + 1 });
        else if (playerName.trim() === '')
            setToast({ ...ERR_NO_PLAYER_NAME, show: toast.show + 1 });
        else history.push('/lobby');
    };

    return (
        <div>
            <Toaster toast={toast} setToast={setToast} />
            <h3>Enter code</h3>
            <input onChange={setGameCodeHandler} value={gameCode} />
            <button onClick={joinGameEnterCodeContinueHandler}>continue</button>
        </div>
    );
}
