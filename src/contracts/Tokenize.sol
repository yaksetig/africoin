// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Tokenize is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() 
        ERC721("Carbon Credit NFT", "CCNFT") 
        Ownable(msg.sender)
    {}

    function mint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function batchMint(address to, string[] memory uris) public onlyOwner {
        for (uint256 i = 0; i < uris.length; i++) {
            mint(to, uris[i]);
        }
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}