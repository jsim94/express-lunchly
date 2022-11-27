/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  static #BASE_SQL_QUERY = `
    SELECT id, 
      first_name AS "firstName",  
      last_name AS "lastName", 
      phone, 
      notes
    FROM customers`;

  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `${this.#BASE_SQL_QUERY}
       ORDER BY last_name, first_name`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `${this.#BASE_SQL_QUERY}
        WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  static async getBest() {
    const results = await db.query(
      `SELECT c.id, 
          c.first_name AS "firstName",  
          c.last_name AS "lastName", 
          c.phone, 
          c.notes,
          COUNT(*) AS res_count
        FROM customers AS c JOIN reservations AS r ON c.id = r.customer_id
        GROUP BY c.id
        ORDER BY res_count DESC
        OFFSET 0 ROWS FETCH FIRST 10 ROWS ONLY`
    );
    return results.rows.map((customer) => new Customer(customer));
  }

  static async search(name) {
    const results = await db.query(
      `${this.#BASE_SQL_QUERY}
      WHERE LOWER(CONCAT_WS(' ', first_name,  last_name)) LIKE $1
      ORDER BY first_name`,
      [`%${name}%`]
    );
    return results.rows.map((customer) => new Customer(customer));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = Customer;
