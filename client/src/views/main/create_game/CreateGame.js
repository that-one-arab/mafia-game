import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { Loading, Toaster } from '../../../components';

const ERR_SELECT_PLAYERS_AMOUNT = {
    show: 1,
    header: 'No players amount selected',
    body: 'Please select amount of players for the game',
};

const ERR_INPUT_PLAYER_NAME = {
    show: 1,
    header: 'Your player name cannot be empty',
    body: 'Your player name is used to identify you in the game, please input a name',
};

export default function CreateGame() {
    const history = useHistory();
    const dispatch = useDispatch();
    const playersAmount = useSelector(
        (state) => state.gameOptions.playersAmount
    );
    const playerName = useSelector((state) => state.player.name);

    const [toast, setToast] = useState({
        show: 0,
        header: '',
        body: '',
    });
    const [loading, setLoading] = useState(false);

    const dispatchPlayerAmountHandler = (e) =>
        dispatch({
            type: 'SET_PLAYERS_AMOUNT',
            payload: Number(e.target.value),
        });

    const dispatchPlayerNameHandler = (e) =>
        dispatch({ type: 'SET_PLAYER_NAME', payload: e.target.value });

    const createRoomHandler = async () => {
        setLoading(true);
        const res = await fetch('/api/room', {
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
            dispatch({ type: 'SET_ROOM_CODE', payload: data.roomCode });
            dispatch({ type: 'SET_PLAYER_ID', payload: data.playerID });
            history.push('/lobby');
        }
    };

    const createGameNextScreenHandler = async () => {
        if (playerName.trim() === '')
            setToast({ ...ERR_INPUT_PLAYER_NAME, show: toast.show + 1 });
        else if (playersAmount === 0)
            setToast({ ...ERR_SELECT_PLAYERS_AMOUNT, show: toast.show + 1 });
        else await createRoomHandler();
    };

    return (
        <div>
            <Loading absolute loading={loading}>
                <div>
                    <h3>Input your name</h3>
                    <input
                        onChange={dispatchPlayerNameHandler}
                        value={playerName}
                    />
                </div>
                <div>
                    <h3>Choose amount of players</h3>
                    <div
                        className='btn-group'
                        role='group'
                        aria-label='Basic outlined example'
                    >
                        <button
                            type='button'
                            className={`btn btn-outline-primary ${
                                playersAmount === 4 ? 'active' : ''
                            }`}
                            onClick={dispatchPlayerAmountHandler}
                            value={4}
                        >
                            4 Players
                        </button>
                        <button
                            type='button'
                            className={`btn btn-outline-primary ${
                                playersAmount === 6 ? 'active' : ''
                            }`}
                            onClick={dispatchPlayerAmountHandler}
                            value={6}
                        >
                            6 Players
                        </button>
                    </div>
                </div>
                <div>
                    <button onClick={createGameNextScreenHandler}>
                        Continue
                    </button>
                </div>
            </Loading>
            <Toaster toast={toast} setToast={setToast} />
        </div>
    );
}
