// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IHive {
    function registerBeneficiary(address) external;
}

contract Hive {

    mapping(address => bool) public bees;
    mapping(address => address[]) public beneficiaryContracts;
    mapping(address => address[]) public ownerBees;

    modifier onlyBee {  
        require(bees[msg.sender] || msg.sender == address(this), "not a bee");
        _;
    }

    constructor() {}

    function deploy(address[] memory _beneficiaries, address _owner, uint256 interval) public {
        PlanBee dep = new PlanBee(_owner, interval, IHive(address(this)));
        bees[address(dep)] = true;
        ownerBees[_owner].push(address(dep));

        dep.init(_beneficiaries);
    }

    function registerBeneficiary(address b) onlyBee public {
        beneficiaryContracts[b].push(msg.sender);
    }
}

contract PlanBee {
    uint256 public livenessIntervalSeconds;
    uint256 public expiresAt;

    address public owner;
    IHive hive;
    mapping(address => bool) beneficiaries;

    bool enabled = true;

    modifier onlyOwner {
      require(msg.sender == owner);
      _;
    }

    modifier onlyHive {
      require(msg.sender == address(hive));
      _;
    }
    
    modifier onlyBeneficiary {
        require(beneficiaries[msg.sender] == true);
        _;
    }

    constructor(address _owner, uint256 interval, IHive _hive) {
        owner = _owner;
        livenessIntervalSeconds = interval;
        expiresAt = block.timestamp + interval;
        hive = _hive;
    }

    function init(address[] memory _beneficiaries) onlyHive public {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            address b = _beneficiaries[i];
            beneficiaries[b] = true;
            hive.registerBeneficiary(b);
        }
    }

    function canClaim() public view returns (bool) {
        return block.timestamp > expiresAt && enabled && beneficiaries[msg.sender] == true;
    }

    function resetCountdown() onlyOwner public {
        expiresAt = block.timestamp + livenessIntervalSeconds;
    }

    function disable() onlyOwner public {
        enabled = false;
    }

    function claim(IERC20 token) onlyBeneficiary public {
        require(enabled, "bee disabled");
        require(canClaim(), "cannot claim");

        uint256 bal = token.balanceOf(owner);
        if (bal == 0) {
            return;
        }

        token.transferFrom(owner, msg.sender, bal);
    }
}

