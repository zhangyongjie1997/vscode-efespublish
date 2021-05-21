const fs = require('fs')
let res = null
try {
    res = fs.readFileSync('./a.txt')
} catch (error) {
    
}
console.log(res)