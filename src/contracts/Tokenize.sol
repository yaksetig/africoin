// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Tokenize is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Maximum supply of tokens
    uint256 public maxSupply;
    
    // Mint price in wei
    uint256 public mintPrice;
    
    // Mapping to track if minting is active
    bool public mintingActive;
    
    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event BaseURIUpdated(string newBaseURI);
    event MintPriceUpdated(uint256 newPrice);
    event MintingStatusChanged(bool active);
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        uint256 _maxSupply,
        uint256 _mintPrice
    ) ERC721(name, symbol) {
        _baseTokenURI = baseTokenURI;
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        mintingActive = true;
    }
    
    // Public mint function
    function mint(address to, string memory tokenURI) public payable returns (uint256) {
        require(mintingActive, "Minting is not active");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIds.current() < maxSupply, "Maximum supply reached");
        require(to != address(0), "Cannot mint to zero address");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        emit TokenMinted(to, newTokenId, tokenURI);
        return newTokenId;
    }
    
    // Owner-only mint function (no payment required)
    function ownerMint(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        require(_tokenIds.current() < maxSupply, "Maximum supply reached");
        require(to != address(0), "Cannot mint to zero address");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        emit TokenMinted(to, newTokenId, tokenURI);
        return newTokenId;
    }
    
    // Batch mint function for owner
    function batchMint(address[] memory recipients, string[] memory tokenURIs) public onlyOwner {
        require(recipients.length == tokenURIs.length, "Arrays length mismatch");
        require(_tokenIds.current() + recipients.length <= maxSupply, "Would exceed maximum supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            
            _safeMint(recipients[i], newTokenId);
            _setTokenURI(newTokenId, tokenURIs[i]);
            
            emit TokenMinted(recipients[i], newTokenId, tokenURIs[i]);
        }
    }
    
    // Get total number of tokens minted
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
    
    // Get remaining tokens that can be minted
    function remainingSupply() public view returns (uint256) {
        return maxSupply - _tokenIds.current();
    }
    
    // Owner functions
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }
    
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }
    
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply >= _tokenIds.current(), "New max supply cannot be less than current supply");
        maxSupply = newMaxSupply;
    }
    
    function toggleMinting() public onlyOwner {
        mintingActive = !mintingActive;
        emit MintingStatusChanged(mintingActive);
    }
    
    // Withdraw contract balance
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Emergency withdraw to specific address
    function emergencyWithdraw(address to) public onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(to).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    // Override functions for URI storage
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Utility function to convert uint to string
    function toStr(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory asciiStr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            asciiStr[k] = b1;
            _i /= 10;
        }
        return string(asciiStr);
    }
    
    // Helper function to generate token URI with token ID
    function generateTokenURI(string memory baseURI, uint256 tokenId) internal pure returns (string memory) {
        return string(abi.encodePacked(baseURI, toStr(tokenId), ".json"));
    }
}
