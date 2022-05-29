//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";


contract ReferralWood is Ownable {

    struct Chest {
        uint256 priceInEth;
        uint256 amountOfReferralsToUnlock;
    }

    struct User {
        uint8 currentLevel;
        address payable referrer;
        address[] referrals; // 3 user refferals
    }

    constructor() {
        for (uint8 i; i < 7; i++) {
            chestsList[i].amountOfReferralsToUnlock = 3**(i+1); // set amount of users to unlock for every chest in list
        }
    }

    mapping(uint8 => Chest) public chestsList;
    mapping(address => User) public usersList; 
    mapping(address => mapping(uint8 => uint16)) public referralsNumberOnLevel; // first nest is level, second is referrals on current level

    function setPrice(uint8 _numberOfChest, uint256 _priceInEth) external onlyOwner() {
        require(_numberOfChest < 7, "Chest total is 7");
        chestsList[_numberOfChest].priceInEth = _priceInEth;
    }

    function joinTo(address payable _referrer) public payable { 
        require(msg.value >= chestsList[usersList[msg.sender].currentLevel].priceInEth, "Insufficient funds to buy a chest"); 
        if(msg.value > chestsList[usersList[msg.sender].currentLevel].priceInEth) { // cashback if user sent more then chest price
            payable(msg.sender).transfer(msg.value - chestsList[usersList[msg.sender].currentLevel].priceInEth);
        }
        if(usersList[msg.sender].referrer == address(0)) {    // if user not registered yet
            usersList[msg.sender].referrer = _referrer;
        } 
        address payable referrer = usersList[msg.sender].referrer;
        if (usersList[referrer].referrals.length < 3) {  // add referral if referrer has empty slotes
            usersList[referrer].referrals.push(msg.sender);
            referralsNumberOnLevel[referrer][0] += 1;
        } else {
            bool brake;
            address[] memory currentLevelReferrals;  // array for user referrals on current nested level
            address[] memory nextLevelReferrals = usersList[referrer].referrals;   // array for user referrals on next nested level
            for(uint8 level; level < 7 && !brake; level++) {
                currentLevelReferrals = nextLevelReferrals;
                delete nextLevelReferrals;
                if(referralsNumberOnLevel[referrer][level] < chestsList[level].amountOfReferralsToUnlock) {
                    for(uint16 referralNumber; referralNumber < currentLevelReferrals.length && !brake; referralNumber++) { 
                        if(usersList[currentLevelReferrals[referralNumber]].referrals.length < 3) {
                            usersList[currentLevelReferrals[referralNumber]].referrals.push(msg.sender); 
                            referralsNumberOnLevel[referrer][level] += 1;
                            brake = true;
                        } else {
                            for(uint8 i; i < 3; i++) {
                                nextLevelReferrals[i] = usersList[currentLevelReferrals[referralNumber]].referrals[i];
                            }
                        }
                    }
                } else {
                    if(level == 0) {
                        nextLevelReferrals = usersList[referrer].referrals;
                    }
                    if(level == usersList[referrer].currentLevel) {
                        referrer.transfer(chestsList[usersList[referrer].currentLevel].priceInEth);
                        usersList[referrer].currentLevel += 1;
                    }
                }
            }
        }
    }

    function parent() public view returns(address) {
        return usersList[msg.sender].referrer;
    }

    function userLevel(address _user) public view returns(uint8) {
        return usersList[_user].currentLevel;
    }
}