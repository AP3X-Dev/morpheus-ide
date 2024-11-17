import { FileType, FolderType } from '../../types';

export async function createEthereumProject(): Promise<(FileType | FolderType)[]> {
  return [
    {
      id: 'package.json',
      name: 'package.json',
      content: `{
  "name": "ethereum-smart-contract",
  "version": "1.0.0",
  "description": "Ethereum Smart Contract Project with Hardhat",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy": "hardhat run scripts/deploy.ts",
    "deploy:testnet": "hardhat run scripts/deploy.ts --network goerli",
    "node": "hardhat node",
    "coverage": "hardhat coverage"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^4.9.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^3.0.0",
    "@nomiclabs/hardhat-ethers": "^2.2.3",
    "@nomiclabs/hardhat-etherscan": "^3.1.7",
    "@typechain/ethers-v6": "^0.5.0",
    "@typechain/hardhat": "^9.0.0",
    "@types/chai": "^4.3.5",
    "@types/mocha": "^10.0.1",
    "@types/node": "^20.5.0",
    "chai": "^4.3.7",
    "ethers": "^6.7.0",
    "hardhat": "^2.17.1",
    "hardhat-gas-reporter": "^1.0.9",
    "solidity-coverage": "^0.8.4",
    "ts-node": "^10.9.1",
    "typechain": "^8.3.1",
    "typescript": "^5.1.6"
  }
}`,
      language: 'json'
    },
    {
      id: 'hardhat.config.ts',
      name: 'hardhat.config.ts',
      content: `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    mainnet: {
      url: process.env.MAINNET_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

export default config;`,
      language: 'typescript'
    },
    {
      id: 'contracts',
      name: 'contracts',
      items: [
        {
          id: 'contracts/Token.sol',
          name: 'Token.sol',
          content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}`,
          language: 'solidity'
        },
        {
          id: 'contracts/NFT.sol',
          name: 'NFT.sol',
          content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    uint256 public mintPrice = 0.05 ether;
    uint256 public maxSupply = 1000;
    bool public isSaleActive = false;
    
    mapping(address => uint256) public mintedPerWallet;
    uint256 public maxPerWallet = 3;

    constructor() ERC721("MyNFT", "MNFT") {}

    function mintNFT(string memory tokenURI) public payable returns (uint256) {
        require(isSaleActive, "Sale is not active");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIds.current() < maxSupply, "Max supply reached");
        require(mintedPerWallet[msg.sender] < maxPerWallet, "Max per wallet reached");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        mintedPerWallet[msg.sender]++;

        return newItemId;
    }

    function toggleSale() public onlyOwner {
        isSaleActive = !isSaleActive;
    }

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }
}`,
          language: 'solidity'
        }
      ]
    },
    {
      id: 'scripts',
      name: 'scripts',
      items: [
        {
          id: 'scripts/deploy.ts',
          name: 'deploy.ts',
          content: `import { ethers } from "hardhat";

async function main() {
  // Deploy Token
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy("MyToken", "MTK", 1000000);
  await token.waitForDeployment();
  console.log("Token deployed to:", await token.getAddress());

  // Deploy NFT
  const NFT = await ethers.getContractFactory("NFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  console.log("NFT deployed to:", await nft.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });`,
          language: 'typescript'
        }
      ]
    },
    {
      id: 'test',
      name: 'test',
      items: [
        {
          id: 'test/Token.test.ts',
          name: 'Token.test.ts',
          content: `import { expect } from "chai";
import { ethers } from "hardhat";
import { Token } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Token", function () {
  let token: Token;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("MyToken", "MTK", 1000000);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(await owner.getAddress());
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await token.balanceOf(await owner.getAddress());
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await token.transfer(await addr1.getAddress(), 50);
      const addr1Balance = await token.balanceOf(await addr1.getAddress());
      expect(addr1Balance).to.equal(50);

      await token.connect(addr1).transfer(await addr2.getAddress(), 50);
      const addr2Balance = await token.balanceOf(await addr2.getAddress());
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(await owner.getAddress());
      await expect(
        token.connect(addr1).transfer(await owner.getAddress(), 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      expect(await token.balanceOf(await owner.getAddress())).to.equal(
        initialOwnerBalance
      );
    });
  });
});`,
          language: 'typescript'
        },
        {
          id: 'test/NFT.test.ts',
          name: 'NFT.test.ts',
          content: `import { expect } from "chai";
import { ethers } from "hardhat";
import { NFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFT", function () {
  let nft: NFT;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
    await nft.toggleSale();
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const mintPrice = await nft.mintPrice();
      await nft.connect(addr1).mintNFT("ipfs://test", { value: mintPrice });
      expect(await nft.ownerOf(1)).to.equal(await addr1.getAddress());
    });

    it("Should fail if payment is insufficient", async function () {
      await expect(
        nft.connect(addr1).mintNFT("ipfs://test", { value: 0 })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should fail if max per wallet is reached", async function () {
      const mintPrice = await nft.mintPrice();
      await nft.connect(addr1).mintNFT("ipfs://test1", { value: mintPrice });
      await nft.connect(addr1).mintNFT("ipfs://test2", { value: mintPrice });
      await nft.connect(addr1).mintNFT("ipfs://test3", { value: mintPrice });
      
      await expect(
        nft.connect(addr1).mintNFT("ipfs://test4", { value: mintPrice })
      ).to.be.revertedWith("Max per wallet reached");
    });
  });

  describe("Admin functions", function () {
    it("Should allow owner to toggle sale", async function () {
      await nft.toggleSale();
      const mintPrice = await nft.mintPrice();
      await expect(
        nft.connect(addr1).mintNFT("ipfs://test", { value: mintPrice })
      ).to.be.revertedWith("Sale is not active");
    });

    it("Should allow owner to withdraw", async function () {
      const mintPrice = await nft.mintPrice();
      await nft.connect(addr1).mintNFT("ipfs://test", { value: mintPrice });
      
      const initialBalance = await ethers.provider.getBalance(await owner.getAddress());
      await nft.withdraw();
      const finalBalance = await ethers.provider.getBalance(await owner.getAddress());
      
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
});`,
          language: 'typescript'
        }
      ]
    },
    {
      id: '.env',
      name: '.env',
      content: `PRIVATE_KEY=your-private-key-here
GOERLI_URL=your-goerli-url-here
MAINNET_URL=your-mainnet-url-here
ETHERSCAN_API_KEY=your-etherscan-api-key-here
REPORT_GAS=true`,
      language: 'plaintext'
    },
    {
      id: '.gitignore',
      name: '.gitignore',
      content: `node_modules
.env
coverage
coverage.json
typechain
typechain-types
dist
cache
artifacts`,
      language: 'plaintext'
    },
    {
      id: 'README.md',
      name: 'README.md',
      content: `# Ethereum Smart Contract Project

A modern Ethereum smart contract project with Hardhat, TypeScript, and OpenZeppelin.

## Features

- ERC20 Token Contract
- ERC721 NFT Contract
- Hardhat Configuration
- TypeScript Support
- Automated Tests
- Gas Reporter
- Code Coverage
- Testnet Deployment
- TypeChain Integration

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure environment:
   - Copy \`.env.example\` to \`.env\`
   - Add your private key and network URLs

3. Compile contracts:
   \`\`\`bash
   npm run compile
   \`\`\`

4. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

## Deployment

1. Deploy to local network:
   \`\`\`bash
   npm run deploy
   \`\`\`

2. Deploy to testnet:
   \`\`\`bash
   npm run deploy:testnet
   \`\`\`

## Contract Details

### Token Contract
- ERC20 implementation
- Mintable by owner
- Burnable by holders

### NFT Contract
- ERC721 implementation
- Configurable mint price
- Max supply limit
- Per-wallet minting limit
- Sale toggle
- Owner withdrawal

## Development

1. Start local node:
   \`\`\`bash
   npm run node
   \`\`\`

2. Run test coverage:
   \`\`\`bash
   npm run coverage
   \`\`\`

## Project Structure

\`\`\`
├── contracts/
│   ├── Token.sol
│   └── NFT.sol
├── scripts/
│   └── deploy.ts
├── test/
│   ├── Token.test.ts
│   └── NFT.test.ts
├── hardhat.config.ts
└── package.json
\`\`\``,
      language: 'markdown'
    }
  ];
}