let web3;
let contract;
let account;

window.addEventListener("load", async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await ethereum.request({ method: 'eth_requestAccounts' });
  } else {
    alert("Please install Metamask!");
    return;
  }

  const res = await web3.eth.getAccounts();
  account = res[0];
  document.getElementById("status").innerText = "Connected: " + account;

  const response = await fetch("../build/contracts/DVoting.json");
  const data = await response.json();
  const abi = data.abi;
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = data.networks[networkId];
  const address = deployedNetwork.address;

  contract = new web3.eth.Contract(abi, address);
});

async function voteCandidate(id) {
    const difficulty = 3;
    const nonce = await findValidNonce(account, id, difficulty);
    
    try {
      await contract.methods.vote(id, nonce).send({ from: account, gas: 500000 });
      alert("Vote successful!");
    } catch (err) {
      console.error("Vote failed:", err.message);
      alert("Transaction failed: " + err.message);
    }
}


async function findValidNonce(account, candidateId, difficulty = 3) {
    let nonce = 0;
    const target = BigInt("0x" + "f".repeat(64)) / BigInt(10 ** difficulty);
    while (true) {
      const hash = web3.utils.soliditySha3({ type: 'address', value: account }, { type: 'uint256', value: candidateId }, { type: 'uint256', value: nonce });
      if (BigInt(hash) < target) {
        return nonce;
      }
      nonce++;
    }
}


async function refreshVoteCounts() {
    try {
      const candidate1 = await contract.methods.candidates(1).call();
      const candidate2 = await contract.methods.candidates(2).call();
  
      document.getElementById("votesCA").innerText = candidate1.voteCount;
      document.getElementById("votesIM").innerText = candidate2.voteCount;
    } catch (err) {
      console.error("Failed to fetch vote counts:", err.message);
      alert("Could not fetch vote counts");
    }
}

// GasGriefing Attack
async function simulateGasGriefing(id) {
  const veryLargeNonce = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

  try {
    const receipt = await contract.methods.vote(id, veryLargeNonce).send({
      from: account,
      gas: 500000
    });

    console.log("Griefing transaction receipt:", receipt);
    alert("Griefing attempt completed. Check Ganache for gas used.");
  } catch (err) {
    console.error("Griefing failed:", err.message);
    alert("Griefing failed: " + err.message);
  }
}

//Replay Attack

let storedNonce = null; //to store the reused nonce

async function originalVoteWithNonce(candidateId) {
  const difficulty = 3;
  const nonce = await findValidNonce(account, candidateId, difficulty);

  try {
    const result = await contract.methods.vote(candidateId, nonce).send({
      from: account,
      gas: 300000
    });
    alert("Vote from A successful");

    storedNonce = nonce;  // Save for replay use
    console.log("Stored nonce for replay:", nonce);
  } catch (err) {
    alert("Vote failed: " + err.message);
  }
}

async function replayVoteWithStoredNonce(candidateId) {
  if (storedNonce === null) {
    alert("No stored nonce available");
    return;
  }

  try {
    const result = await contract.methods.vote(candidateId, storedNonce).send({
      from: account,
      gas: 300000
    });
    alert("Replay vote successful (vulnerability exists!)");
  } catch (err) {
    alert("Replay vote failed: " + err.message);
  }
}
