const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'futureferrari',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */


//new code:
const getUserWithEmail = (email) => {
  return pool.query(`
      SELECT * FROM users
      WHERE email = $1;
      `,
  [email])
    .then((result) => {
      console.log(result);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/* original code:
const getUserWithEmail = function(email) {
  let user;
  for (const userId in users) {
    user = users[userId];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      break;
    } else {
      user = null;
    }
  }
  return Promise.resolve(user);
};

exports.getUserWithEmail = getUserWithEmail;
*/

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

// new code:
const getUserWithId = function(id) {
  return pool.query(`
      SELECT * FROM users
      WHERE id = ${id};
      `,
  [id])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getUserWithId = getUserWithId;

/*
const getUserWithId = function(id) {
  return Promise.resolve(users[id]);
};
exports.getUserWithId = getUserWithId;
*/

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

// new code:
const addUser =  function(user) {
  return pool.query(`
      INSERT INTO users (name, email, password) 
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
  [user.name, user.email, user.password]);
};
exports.addUser = addUser;

/* old code:
const addUser =  function(user) {
  const userId = Object.keys(users).length + 1;
  user.id = userId;
  users[userId] = user;
  return Promise.resolve(user);
};
exports.addUser = addUser;
*/

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

// new code:
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(`
      SELECT reservations.*, properties.*
      FROM reservations
      JOIN users ON users.id = reservations.guest_id
      JOIN properties ON properties.id = reservations.property_id
      WHERE users.id = $1
      LIMIT $2;
      `,
  [guest_id, limit])
    .then(res => {
      return res.rows;
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getAllReservations = getAllReservations;

/*
const getAllReservations = function(guest_id, limit = 10) {
  return getAllProperties(null, 2);
};
exports.getAllReservations = getAllReservations;
*/
/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

//new code:
const getAllProperties = (options, limit = 10) => {
  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1=1
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city LIKE $${queryParams.length}`;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night*100, options.maximum_price_per_night*100);
    queryString += `
      AND cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}
      `;
  }

  queryString += `
  GROUP BY properties.id`;

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `
    HAVING avg(rating) >= $${queryParams.length}
    `;
  }
  queryParams.push(limit);
  
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  
  console.log(options);
  console.log(queryString,queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
};
  
exports.getAllProperties = getAllProperties;

/* //new code:
const getAllProperties = (options, limit = 10) => {
  
  return pool.query(`
      SELECT * FROM properties
      LIMIT $1;
      `,
  [limit])
    .then((result) => {
      return result.rows;

    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getAllProperties = getAllProperties;
*/

/* old code:
const getAllProperties = function(options, limit = 10) {
  const limitedProperties = {};
  for (let i = 1; i <= limit; i++) {
    limitedProperties[i] = properties[i];
  }
  return Promise.resolve(limitedProperties);
};
exports.getAllProperties = getAllProperties;
*/

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

// new code:

const addProperty = function(property) {
  const propertyParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];

  let propertyString = `
    INSERT INTO properties (
      owner_id, 
      title, 
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      street,
      city,
      province,
      post_code,
      country,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, $14)
    RETURNING *;
    `;
  
  return pool.query(propertyString, propertyParams)
    .then(res => {
      console.log(res.rows);
      return res.rows;
    })
    .catch(err => {
      console.log(err);
    });
};
exports.addProperty = addProperty;

/* old code:
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
*/
