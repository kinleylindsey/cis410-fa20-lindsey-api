const sql = require('mssql')
const kinleyConfig = require('./config.js')

const config = {
    user: kinleyConfig.DB.user,
    password: kinleyConfig.DB.password,
    server: kinleyConfig.DB.server,
    database: kinleyConfig.DB.database,
}


async function executeQuery(aQuery){
    var connection = await sql.connect(config)
    var result = await connection.query(aQuery)

    return result.recordset
}  

executeQuery()

module.exports = {executeQuery: executeQuery}