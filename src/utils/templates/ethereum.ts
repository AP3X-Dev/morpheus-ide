import { FileType, FolderType } from '../../types';

export async function createEthereumProject(): Promise<(FileType | FolderType)[]> {
  return [
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
        }
      ]
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
    }
  ];
}