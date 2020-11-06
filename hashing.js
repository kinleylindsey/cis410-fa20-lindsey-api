const bcrypt = require('bcryptjs')

var hashedPassword = bcrypt.hashSync("asdfasdf")

console.log(hashedPassword)

var hashTest = bcrypt.compareSync('asdfasdfs',hashedPassword)
console.log(hashTest)