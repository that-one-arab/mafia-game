export const parseTownDisabled = (myPlayer, player) => {
    if (!myPlayer.playerAlive) return true;

    if (typeof myPlayer.actionCount === 'number' && !myPlayer.actionCount) {
        return true;
    }

    if (myPlayer.playerRole === 'Brawler') {
        if (myPlayer.playerID === player.playerID) {
            return false;
        }
        return true;
    } else {
        if (myPlayer.playerID === player.playerID) return true;
        return false;
    }
};

export const parseTownDisabledClass = (myPlayer, player) => {
    if (!myPlayer.playerAlive) return 'btn-choose-people-disabled';

    if (typeof myPlayer.actionCount === 'number' && !myPlayer.actionCount) {
        return 'btn-choose-people-disabled';
    }

    if (myPlayer.playerRole === 'Brawler') {
        if (myPlayer.playerID === player.playerID) {
            return 'btn-choose-people';
        }
        return 'btn-choose-people-disabled';
    } else {
        if (myPlayer.playerID === player.playerID) return 'btn-choose-people-disabled';
        return 'btn-choose-people';
    }
};

export const parseMafiaSelectButton = (player) => {
    if (player.escortActionOn) return 'btn-purple';
    else if (player.actionTotal) return 'btn-black';
};
