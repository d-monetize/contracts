pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract ScamToken is ERC20 {
    constructor() public {
        _mint(msg.sender, 1000000);
    }

    function mint(uint amount) public {
        _mint(msg.sender, amount);
    }

    // Simulate transfer that does not transfer token
    function transferFrom(address from, address to, uint value) public returns (bool) {
      return true;
    }

    function burn(uint amount) public {
      _burn(msg.sender, amount);
    }
}
