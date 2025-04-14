// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./TicketNFT.sol";
import "./CheckInManager.sol";

contract EventManager is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _eventIds;

    struct Event {
        uint256 id;
        string name;
        string description;
        string imageUri;
        address organizer;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 startTime;
        uint256 endTime;
        address ticketContract;
        address checkInContract;
        bool isActive;
    }

    mapping(uint256 => Event) public events;
    mapping(address => uint256[]) public organizerEvents;

    event EventCreated(
        uint256 indexed eventId,
        string name,
        address organizer,
        address ticketContract,
        address checkInContract
    );

    constructor() Ownable(msg.sender) {}

    function createEvent(
        string memory name,
        string memory description,
        string memory imageUri,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 startTime,
        uint256 endTime,
        bool isSoulbound
    ) external returns (uint256) {
        require(startTime > block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");
        require(maxTickets > 0, "Max tickets must be greater than 0");

        _eventIds.increment();
        uint256 eventId = _eventIds.current();

        // Deploy new TicketNFT contract
        TicketNFT ticketContract = new TicketNFT(
            name,
            string(abi.encodePacked("TICKET-", name)),
            isSoulbound
        );

        // Deploy new CheckInManager contract
        CheckInManager checkInContract = new CheckInManager(
            address(ticketContract)
        );

        events[eventId] = Event({
            id: eventId,
            name: name,
            description: description,
            imageUri: imageUri,
            organizer: msg.sender,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            startTime: startTime,
            endTime: endTime,
            ticketContract: address(ticketContract),
            checkInContract: address(checkInContract),
            isActive: true
        });

        organizerEvents[msg.sender].push(eventId);

        emit EventCreated(
            eventId,
            name,
            msg.sender,
            address(ticketContract),
            address(checkInContract)
        );

        return eventId;
    }

    function getEvent(uint256 eventId) external view returns (Event memory) {
        return events[eventId];
    }

    function getOrganizerEvents(address organizer) external view returns (uint256[] memory) {
        return organizerEvents[organizer];
    }

    function toggleEventStatus(uint256 eventId) external {
        require(events[eventId].organizer == msg.sender, "Not the organizer");
        events[eventId].isActive = !events[eventId].isActive;
    }
} 