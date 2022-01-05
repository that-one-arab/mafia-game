export const parseTownDisabled = (myPlayer, player) => {
    if (myPlayer.playerRole === 'Bodyguard') {
        if (myPlayer.playerID === player.playerID) {
            return false;
        }
        return true;
    } else {
        if (myPlayer.playerID === player.playerID) return true;
        return false;
    }
};

export const parseMafiaSelectButton = (player) => {
    if (player.godfatherActionOn) return 'btn-danger';
    else if (player.escortActionOn) return 'btn-info';
    else if (player.actionTotal) return 'btn-dark';
    else return 'btn-primary';
};
