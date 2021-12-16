import Main from "../views/main/Main";
import JoinGame from "../views/main/join_game/JoinGame";
import Lobby from "../views/main/lobby/Lobby";

export const routes = [
  {
    path: "/",
    exact: true,
    name: "main",
    component: Main,
  },
  {
    path: "/join-game",
    exact: true,
    name: "join game",
    component: JoinGame,
  },
  {
    path: "/lobby",
    exact: true,
    name: "lobby",
    component: Lobby,
  },
];
