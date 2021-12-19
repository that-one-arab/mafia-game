const { v4: uuid } = require('uuid');

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
};
