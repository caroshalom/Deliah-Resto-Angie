const { Sequelize } = require('sequelize');
// const sequelize = new Sequelize('mysql://user:pass@host:port/database');
const db = new Sequelize("Delilah", "root", "Angie123", {
    dialect: "mysql",
    host: "localhost",
    port: 3306,
});

// Use QueryTypes SELECT Method whenever is needed
async function querySelector(query, selectQ = false, replacements = {}) {
    let typeQ;
    if (selectQ) {
        typeQ = db.QueryTypes.SELECT;
    } else {
        typeQ = undefined;
    }
    console.log(replacements)
    try {
        let consulta = await db.query(query, {
            type: typeQ,
            raw: true,
            replacements
        })
        return consulta;
    } catch (error) {
        console.log(error);
    }


}

module.exports = {
    db,
    querySelector
};