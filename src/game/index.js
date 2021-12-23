/** */
module.exports = {
    Game: class Game {
        /** */
        constructor(roomID, players) {
            this.roomID = roomID;
            this.players = players;
            this.dayCount = 0;
        }

        /** */
        incrementDayCount() {
            this.dayCount++;
        }

        /** */
        getPlayers() {
            return this.players;
        }
    },
};
