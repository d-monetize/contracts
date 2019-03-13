pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract TestToken is ERC20 {
    constructor() public {
        _mint(msg.sender, 1000000);
    }

    function mint(uint amount) public {
        _mint(msg.sender, amount);
    }
}
