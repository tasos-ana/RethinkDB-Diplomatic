'use strict';

const crypto = require('crypto');

/**
 * API for encrypt and decrypt
 * @type {{encrypt, decrypt}}
 */
const encryption = function () {

    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bytes (32 characters)
    const IV_LENGTH = 16; // For AES, this is always 16

    return {
        encrypt : _encrypt,
        decrypt : _decrypt
    };

    /**
     * Encrypt text
     * @param text
     * @returns {string}
     * @private
     */
    function _encrypt(text) {
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);

        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    /**
     * Decrypt text
     * @param text
     * @returns {string}
     * @private
     */
    function _decrypt(text) {
        let textParts = text.split(':');
        let iv = new Buffer(textParts.shift(), 'hex');
        let encryptedText = new Buffer(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);

        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    }


}();

module.exports = encryption;