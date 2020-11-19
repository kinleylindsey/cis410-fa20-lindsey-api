const sql = require('mssql')
const lindseyConfig = require('./config.js')

const config = {
    user: lindseyConfig.DB.user,
    password: lindseyConfig.DB.password,
    server: lindseyConfig.DB.server,
    database: lindseyConfig.DB.database,
}


async function executeQuery(aQuery){
    var connection = await sql.connect(config)
    var result = await connection.query(aQuery)

    return result.recordset
}  

// executeQuery()

module.exports = {executeQuery: executeQuery}