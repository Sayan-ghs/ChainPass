// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CheckInManager is Ownable {
    struct Reward {
        address tokenAddress;
        uint256 amount;
        bool isNFT;
        bool isClaimed;
    }

    address public ticketContract;
    mapping(uint256 => Reward) public rewards; // tokenId => Reward
    mapping(uint256 => bool) public checkIns; // tokenId => isCheckedIn
    mapping(uint256 => bool) public rewardClaims; // tokenId => isClaimed

    event CheckedIn(uint256 indexed tokenId, address indexed attendee);
    event RewardClaimed(uint256 indexed tokenId, address indexed attendee);

    constructor(address _ticketContract) Ownable(msg.sender) {
        ticketContract = _ticketContract;
    }

    function setReward(
        uint256 tokenId,
        address tokenAddress,
        uint256 amount,
        bool isNFT
    ) external onlyOwner {
        rewards[tokenId] = Reward({
            tokenAddress: tokenAddress,
            amount: amount,
            isNFT: isNFT,
            isClaimed: false
        });
    }

    function checkIn(uint256 tokenId) external {
        require(IERC721(ticketContract).ownerOf(tokenId) == msg.sender, "Not ticket owner");
        require(!checkIns[tokenId], "Already checked in");
        
        checkIns[tokenId] = true;
        emit CheckedIn(tokenId, msg.sender);
    }

    function claimReward(uint256 tokenId) external {
        require(checkIns[tokenId], "Not checked in");
        require(!rewardClaims[tokenId], "Reward already claimed");
        
        Reward memory reward = rewards[tokenId];
        require(reward.tokenAddress != address(0), "No reward set");
        
        rewardClaims[tokenId] = true;
        
        if (reward.isNFT) {
            IERC721(reward.tokenAddress).transferFrom(
                address(this),
                msg.sender,
                reward.amount
            );
        } else {
            IERC20(reward.tokenAddress).transfer(msg.sender, reward.amount);
        }
        
        emit RewardClaimed(tokenId, msg.sender);
    }

    function isCheckedIn(uint256 tokenId) external view returns (bool) {
        return checkIns[tokenId];
    }

    function hasClaimedReward(uint256 tokenId) external view returns (bool) {
        return rewardClaims[tokenId];
    }
} 