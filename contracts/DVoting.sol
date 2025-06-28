// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DVoting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(bytes32 => bool) public usedNonces;

    uint public candidatesCount;
    uint public difficulty = 3; // adjustable PoW difficulty

    constructor() {
        addCandidate("Captain America");
        addCandidate("Iron Man");
    }

    function addCandidate(string memory _name) internal {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    // Simulated Proof of Work-require nonce that gives a hash with leading zeros
function vote(uint _candidateId, uint nonce) public {

    require(!hasVoted[msg.sender], "Already voted.");
    
    //require(nonce < 1000000, "Nonce value too large");
    
    require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

    bytes32 hash = keccak256(abi.encodePacked(msg.sender, _candidateId, nonce));
    
    //require(!usedNonces[hash], "Nonce reused");
    
    require(uint256(hash) < type(uint256).max / (10 ** difficulty), "Invalid PoW");

    usedNonces[hash] = true;
    
    hasVoted[msg.sender] = true;
    
    candidates[_candidateId].voteCount++;
    
}


}

