import Main from '../views/main/Main';
import JoinGame from '../views/main/join_game/JoinGame';
import JoinGameEnterCode from '../views/main/join_game_enter_code/JoinGameEnterCode';
import CreateGame from '../views/main/create_game/CreateGame';
import Lobby from '../views/main/lobby/Lobby';

export const routes = [
    {
        path: '/',
        exact: true,
        name: 'main',
        component: Main,
    },

    {
        path: '/create-game',
        exact: true,
        name: 'create game',
        component: CreateGame,
    },

    {
        path: '/join-game',
        exact: true,
        name: 'join game',
        component: JoinGame,
    },
    {
        path: '/join-game/enter-code',
        exact: true,
        name: 'join game enter code',
        component: JoinGameEnterCode,
    },
    {
        path: '/lobby',
        exact: true,
        name: 'lobby',
        component: Lobby,
    },
];
