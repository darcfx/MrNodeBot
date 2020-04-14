const rp = require('request-promise-native');
const logger = require('../../lib/logger');

const endPoint = 'https://freegeoip.net/json/';

module.exports = async (host) => {
    if (!host) { throw new Error('No host was provided.'); }

    try {
        return await rp({
            uri: `${endPoint}${host}`,
            json: true,
        });
    }
    // Catch Errors
    catch (err) {
        logger.warn('Error in the _ipLocationData generator', {
            message: err.message || '',
            stack: err.stack || '',
        });

        return Object.create({});
    }
};

// Return GEO IP Data in the following format
//     {
//     ip: '',
//     country_code: '',
//     country_name: '',
//     region_code: '',
//     region_name: '',
//     city: '',
//     zip_code: '',
//     time_zone: '',
//     latitude: 0,
//     longitude: 0,
//     metro_code: 0
//   }
//
// If the host is invalid, and the request fails, a empty object will be returned
