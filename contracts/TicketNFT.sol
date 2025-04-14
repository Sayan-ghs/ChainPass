// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    bool public isSoulbound;
    mapping(uint256 => bool) public isUsed;
    mapping(address => uint256) public userTickets;

    event TicketMinted(address indexed to, uint256 indexed tokenId);
    event TicketUsed(uint256 indexed tokenId);

    constructor(
        string memory name,
        string memory symbol,
        bool _isSoulbound
    ) ERC721(name, symbol) Ownable(msg.sender) {
        isSoulbound = _isSoulbound;
    }

    function mint(address to, string memory tokenURI) external onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        userTickets[to] = newTokenId;

        emit TicketMinted(to, newTokenId);
        return newTokenId;
    }

    function markAsUsed(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(!isUsed[tokenId], "Ticket already used");
        isUsed[tokenId] = true;
        emit TicketUsed(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        if (isSoulbound && from != address(0)) {
            revert("Token is soulbound and cannot be transferred");
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function getTicketId(address user) external view returns (uint256) {
        return userTickets[user];
    }

    function isTicketValid(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId) && !isUsed[tokenId];
    }
} 