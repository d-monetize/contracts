const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

module.exports = {
  web3,
  ZERO_ADDRESS,
}
