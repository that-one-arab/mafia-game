const { v4: uuid } = require('uuid');
const { PlayerAmount } = require('../models');

module.exports = {
    /**
     * @returns unique ID
     * @param {String} beginingPad an optional string to add to the begining of the uuid
     * @param {String} endPad an optional string to add to the end of the uuid
     */
    uuid: (beginingPad = '', endPad = '', { idFor = undefined } = {}) => {
        if (idFor) {
            switch (idFor) {
                case 'ROOM_CODE':
                    const id = uuid().slice(-6);
                    return id;

                default:
                    break;
            }
        }
        return `${beginingPad}${uuid()}${endPad}`;
    },

    validatePlayersAmount: async (playersAmountInput) => {
        try {
            const playersAmount = await PlayerAmount.find();
            const allowedPlayersAmount = playersAmount[0].amount;
            if (!allowedPlayersAmount.includes(playersAmountInput))
                throw 'NOT_ALLOWED_ERR Players amount not allowed';
        } catch (error) {
            throw new Error(error);
        }
    },
};
