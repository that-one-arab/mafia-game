import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster, Loading } from '../../../components';

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
    const [toast, setToast] = useState({ show: 0, header: '', body: '' });
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
            setToast({ ...ERR_GAME_CODE_INVALID, show: toast.show + 1 });
        }
    };

    const joinGameEnterCodeContinueHandler = async () => {
        if (gameCode.trim() === '')
            setToast({ ...ERR_ENTER_GAME_CODE, show: toast.show + 1 });
        else if (gameCode.trim().length > 6)
            setToast({ ...ERR_GAME_CODE_TOO_LONG, show: toast.show + 1 });
        else if (playerName.trim() === '')
            setToast({ ...ERR_NO_PLAYER_NAME, show: toast.show + 1 });
        else await getGameWithCodeHandler();
    };

    /** This would fire if: player joins a lobby; lobby is already full; lobby route pushed player back to join-game-enter-code route and adds a ?joinStatus=room-full query param */
    useEffect(() => {
        const joinStatus = query.get('joinStatus');
        if (joinStatus === 'room-full') {
            setToast((prevVal) => ({
                ...ERR_ROOM_FULL,
                show: prevVal.show + 1,
            }));
        } else if (joinStatus === 'lobby-owner-exited') {
            setToast((prevVal) => ({
                ...ERR_LOBBY_OWNER_LEFT,
                show: prevVal.show + 1,
            }));
        }
    }, [query]);

    return (
        <div>
            <Loading absolute loading={loading}>
                <Toaster toast={toast} setToast={setToast} />
                <h3>Enter code</h3>
                <input onChange={setGameCodeHandler} value={gameCode} />
                <button onClick={joinGameEnterCodeContinueHandler}>
                    continue
                </button>
            </Loading>
        </div>
    );
}
