import React, { useState, useCallback } from 'react';
import { Upload, FileText, Coins, CheckCircle, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { WalletConnect } from "@/components/WalletConnect";
import { FileUpload } from "@/components/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { ethers } from 'ethers';

// Contract ABI for tokenizat ion
const TOKENIZE_CONTRACT_ABI = [
{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "OwnableInvalidOwner",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "account",
                                "type": "address"
                            }
                        ],
                        "name": "OwnableUnauthorizedAccount",
                        "type": "error"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "previousOwner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "newOwner",
                                "type": "address"
                            }
                        ],
                        "name": "OwnershipTransferred",
                        "type": "event"
                    },
                    {
                        "inputs": [],
                        "name": "owner",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "renounceOwnership",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "newOwner",
                                "type": "address"
                            }
                        ],
                        "name": "transferOwnership",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
{
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "approved",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Approval",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "indexed": false,
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "ApprovalForAll",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "_fromTokenId",
                                "type": "uint256"
                            },
                            {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "_toTokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "BatchMetadataUpdate",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "_tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "MetadataUpdate",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Transfer",
                        "type": "event"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "approve",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "balanceOf",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "balance",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "getApproved",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "name": "isApprovedForAll",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ownerOf",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bytes",
                                "name": "data",
                                "type": "bytes"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "setApprovalForAll",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "bytes4",
                                "name": "interfaceId",
                                "type": "bytes4"
                            }
                        ],
                        "name": "supportsInterface",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "transferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "balance",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "needed",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC1155InsufficientBalance",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "approver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC1155InvalidApprover",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "idsLength",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "valuesLength",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC1155InvalidArrayLength",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "name": "ERC1155InvalidOperator",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "receiver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC1155InvalidReceiver",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            }
                        ],
                        "name": "ERC1155InvalidSender",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "ERC1155MissingApprovalForAll",
                        "type": "error"
                    },
{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "spender",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "allowance",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "needed",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC20InsufficientAllowance",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "balance",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "needed",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC20InsufficientBalance",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "approver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC20InvalidApprover",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "receiver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC20InvalidReceiver",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            }
                        ],
                        "name": "ERC20InvalidSender",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "spender",
                                "type": "address"
                            }
                        ],
                        "name": "ERC20InvalidSpender",
                        "type": "error"
                    },
{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721IncorrectOwner",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC721InsufficientApproval",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "approver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidApprover",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidOperator",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidOwner",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "receiver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidReceiver",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidSender",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC721NonexistentToken",
                        "type": "error"
                    },
{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721IncorrectOwner",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC721InsufficientApproval",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "approver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidApprover",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidOperator",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidOwner",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "receiver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidReceiver",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidSender",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC721NonexistentToken",
                        "type": "error"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "approved",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Approval",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "indexed": false,
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "ApprovalForAll",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Transfer",
                        "type": "event"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "approve",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "balanceOf",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "getApproved",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "name": "isApprovedForAll",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "name",
                        "outputs": [
                            {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ownerOf",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bytes",
                                "name": "data",
                                "type": "bytes"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "setApprovalForAll",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "bytes4",
                                "name": "interfaceId",
                                "type": "bytes4"
                            }
                        ],
                        "name": "supportsInterface",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "symbol",
                        "outputs": [
                            {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "tokenURI",
                        "outputs": [
                            {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "transferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
{
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "approved",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Approval",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "indexed": false,
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "ApprovalForAll",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Transfer",
                        "type": "event"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "approve",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "balanceOf",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "balance",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "getApproved",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "name": "isApprovedForAll",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ownerOf",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bytes",
                                "name": "data",
                                "type": "bytes"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "setApprovalForAll",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "bytes4",
                                "name": "interfaceId",
                                "type": "bytes4"
                            }
                        ],
                        "name": "supportsInterface",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "transferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bytes",
                                "name": "data",
                                "type": "bytes"
                            }
                        ],
                        "name": "onERC721Received",
                        "outputs": [
                            {
                                "internalType": "bytes4",
                                "name": "",
                                "type": "bytes4"
                            }
                        ],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721IncorrectOwner",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC721InsufficientApproval",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "approver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidApprover",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidOperator",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidOwner",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "receiver",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidReceiver",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                            }
                        ],
                        "name": "ERC721InvalidSender",
                        "type": "error"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ERC721NonexistentToken",
                        "type": "error"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "approved",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Approval",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "indexed": false,
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "ApprovalForAll",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "_fromTokenId",
                                "type": "uint256"
                            },
                            {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "_toTokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "BatchMetadataUpdate",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "_tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "MetadataUpdate",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Transfer",
                        "type": "event"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "approve",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "balanceOf",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "getApproved",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "name": "isApprovedForAll",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "name",
                        "outputs": [
                            {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ownerOf",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bytes",
                                "name": "data",
                                "type": "bytes"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "setApprovalForAll",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "bytes4",
                                "name": "interfaceId",
                                "type": "bytes4"
                            }
                        ],
                        "name": "supportsInterface",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "symbol",
                        "outputs": [
                            {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "tokenURI",
                        "outputs": [
                            {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "transferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
{
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "approved",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Approval",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "indexed": false,
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "ApprovalForAll",
                        "type": "event"
                    },
                    {
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "indexed": true,
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "Transfer",
                        "type": "event"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "approve",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "name": "balanceOf",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "balance",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "getApproved",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            }
                        ],
                        "name": "isApprovedForAll",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "name",
                        "outputs": [
                            {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "ownerOf",
                        "outputs": [
                            {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            },
                            {
                                "internalType": "bytes",
                                "name": "data",
                                "type": "bytes"
                            }
                        ],
                        "name": "safeTransferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "operator",
                                "type": "address"
                            },
                            {
                                "internalType": "bool",
                                "name": "approved",
                                "type": "bool"
                            }
                        ],
                        "name": "setApprovalForAll",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "bytes4",
                                "name": "interfaceId",
                                "type": "bytes4"
                            }
                        ],
                        "name": "supportsInterface",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "symbol",
                        "outputs": [
                            {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "tokenURI",
                        "outputs": [
                            {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                            }
                        ],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                            },
                            {
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "tokenId",
                                "type": "uint256"
                            }
                        ],
                        "name": "transferFrom",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
];

// Contract address 
const CONTRACT_ADDRESS = "0x6AB61b2006a18c630d6F8C5000D15A33B77F4Ba9"; //actual

interface CSVRow {
  [key: string]: string | number;
}

interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  maxSupply: number;
}

const Index = () => {
  // Keeping your existing state variable names
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>(''); // Connected address
  const [isConnected, setIsConnected] = useState(false); // Wallet connection status
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig>({
    name: '',
    symbol: '',
    description: '',
    maxSupply: 1000
  });
  const [mintingProgress, setMintingProgress] = useState<{
    current: number;
    total: number;
    isActive: boolean;
  }>({
    current: 0,
    total: 0,
    isActive: false
  });

  // New states for ethers.js provider and signer
  const [ethersProvider, setEthersProvider] = useState<ethers.BrowserProvider | null>(null);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const { toast } = useToast();

  /**
   * Handles file upload and parses data from CSV or Excel.
   * Updates csvData and csvHeaders states.
   */
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) {
        toast({
          title: "File read error",
          description: "No data found in the file.",
          variant: "destructive",
        });
        return;
      }

      let parsedContent: CSVRow[] = [];
      let headers: string[] = [];

      try {
        if (file.name.endsWith('.csv')) {
          const lines = (data as string).split('\n').filter(line => line.trim() !== ''); // Filter out empty lines
          if (lines.length === 0) throw new Error("CSV file is empty.");

          headers = lines[0].split(',').map(h => h.trim());
          parsedContent = lines.slice(1).map((line, rowIndex) => {
            const values = line.split(',').map(v => v.trim());
            const rowData: CSVRow = { id: rowIndex }; // Add an internal ID for selection
            headers.forEach((header, i) => {
              rowData[header] = values[i] || '';
            });
            return rowData;
          });
        } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

          if (jsonData.length === 0) throw new Error("Excel sheet is empty.");

          headers = jsonData[0];
          parsedContent = jsonData.slice(1).map((row, rowIndex) => {
            const rowData: CSVRow = { id: rowIndex }; // Add an internal ID for selection
            headers.forEach((header, i) => {
              rowData[header] = row[i] || '';
            });
            return rowData;
          });
        } else {
          toast({
            title: "Unsupported file type",
            description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls).",
            variant: "destructive",
          });
          return;
        }

        if (parsedContent.length === 0) {
        toast({
            title: "No Data Found",
            description: "The file was parsed, but no rows of data were found.",
            variant: "default",
        });
            return;
        }

        setCsvHeaders(headers);
        setCsvData(parsedContent);
        setCurrentStep(2); // Move to Review Data step
        toast({
          title: "File processed successfully",
          description: `Found ${parsedContent.length} records in ${file.name}.`,
        });
      } catch (error: any) {
        console.error("Error parsing file:", error);
        toast({
          title: "Error parsing file",
          description: error.message || "Please check your file format and content, then try again.",
          variant: "destructive",
        });
        setCsvData([]);
        setCsvHeaders([]);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  }, [toast]);

  const handleRowSelection = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === csvData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(csvData.map((_, index) => index)));
    }
  };

  const handleDeleteSelected = () => {
    const newData = csvData.filter((_, index) => !selectedRows.has(index));
    setCsvData(newData);
    setSelectedRows(new Set());
    toast({
      title: "Rows deleted",
      description: `Removed ${selectedRows.size} rows from your data`,
    });
  };

  // Updated to only receive address, then create provider and signer
  const handleWalletConnect = async (address: string) => {
    setWalletAddress(address);
    setIsConnected(true);
    
    // Create provider and signer from the connected wallet
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setEthersProvider(provider);
      setEthersSigner(signer);
    } catch (error) {
      console.error('Error creating provider/signer:', error);
    }
    if (csvData.length > 0) {
      setCurrentStep(3); // Only move to step 3 if there's data to mint
    }
    toast({
      title: "Wallet connected successfully",
      description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
    });
  };

  const handleWalletDisconnect = () => {
    setWalletAddress('');
    setIsConnected(false);
    setEthersProvider(null);
    setEthersSigner(null);
    setCurrentStep(csvData.length > 0 ? 2 : 1);
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const downloadTemplate = () => {
    const templateData = [
      ['SerialNumber', 'CarbonQuantity', 'ProjectID', 'VintageYear', 'GeographicCoordinates', 'Description'],
      ['1001', '50', 'ProjectAlpha', '2023', '34.0522,-118.2437', 'Carbon offset from renewable energy project.'],
      ['1002', '75', 'ProjectBeta', '2024', '40.7128,-74.0060', 'Carbon offset from sustainable forestry.']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "africoin_carbon_credit_template.csv");
  };

  /**
   * Handles the minting of selected individual NFTs directly via MetaMask.
   * Renamed from handleMintTokens for clarity
   */
  const mintIndividualNFTs = async () => {
    if (!isConnected || !walletAddress || !ethersProvider || !ethersSigner) {
      toast({
        title: "Wallet Not Ready",
        description: "Please ensure your wallet is connected and ready for transactions.",
        variant: "destructive",
      });
      return;
    }

    const selectedData = Array.from(selectedRows).map(index => csvData[index]);

    if (selectedData.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one row to mint.",
        variant: "destructive",
      });
      return;
    }

    setMintingProgress({ current: 0, total: selectedData.length, isActive: true });
    setCurrentStep(3); // Move to the Minting NFTs step

    try {
      // 1. Prepare data for IPFS upload
      const carbonCreditDataList = selectedData.map(row => {
        // IMPORTANT: Customize this mapping based on your actual CSV/Excel column headers
        // These keys should match what you expect in your Flask backend for metadata generation
        const serialNumber = String(row?.SerialNumber || row?.serialNumber || row?.id || row[Object.keys(row)[0]] || '');
        return {
          serialNumber: serialNumber,
          CarbonQuantity: row?.['CarbonQuantity'] || row?.['Carbon Quantity'] || 'N/A',
          ProjectID: row?.['ProjectID'] || row?.['Project ID'] || 'N/A',
          VintageYear: row?.['VintageYear'] || row?.['Vintage Year'] || 'N/A',
          GeographicCoordinates: row?.['GeographicCoordinates'] || row?.['Geographic Coordinates'] || 'N/A',
          Description: row?.['Description'] || 'A unique carbon credit NFT.', // Add a generic description if not in CSV
          Name: row?.['Name'] || `Carbon Credit NFT #${serialNumber}` // Add a generic name
          // Add more attributes based on your CSV/Excel columns
        };
      }).filter(item => item.serialNumber);

      if (carbonCreditDataList.length === 0) {
          toast({
              title: "Data Error",
              description: "Could not extract valid serial numbers from selected rows for IPFS upload.",
              variant: "destructive",
          });
          setMintingProgress(prev => ({ ...prev, isActive: false }));
          return;
      }

      // 2. Call backend to upload metadata to IPFS
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("VITE_BACKEND_URL is not configured in .env file.");
      }

      toast({
        title: "Uploading Metadata to IPFS",
        description: "This may take a moment...",
        variant: "default",
      });

      const ipfsUploadResponse = await fetch(`${backendUrl}/upload_metadata_to_ipfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ carbonCreditDataList }),
      });

      if (!ipfsUploadResponse.ok) {
        const errorData = await ipfsUploadResponse.json();
        throw new Error(`IPFS upload failed: ${errorData.message || ipfsUploadResponse.statusText}`);
      }

      const ipfsResult = await ipfsUploadResponse.json();
      const uploadedURIsMap = new Map(ipfsResult.uploadedURIs.map((item: any) => [item.serialNumber, item.tokenURI]));

      if (ipfsResult.uploadedURIs.filter((item: any) => item.tokenURI).length === 0) {
          throw new Error("No metadata successfully uploaded to IPFS.");
      }

      toast({
        title: "Metadata Uploaded",
        description: `Successfully uploaded metadata for ${ipfsResult.uploadedURIs.length} items to IPFS.`,
        variant: "default",
      });

      // 3. Instantiate the contract using the constant ABI and signer from MetaMask
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        TOKENIZE_CONTRACT_ABI,
        ethersSigner
      );

      const successfulMints: { serialNumber: string; transactionHash: string }[] = [];
      const failedMints: { serialNumber: string; error: string }[] = [];

      for (let i = 0; i < carbonCreditDataList.length; i++) {
        const item_data = carbonCreditDataList[i];
        const serial_num_str = item_data.serialNumber;
        const tokenURI = uploadedURIsMap.get(serial_num_str);

        if (!tokenURI) {
            failedMints.push({ serialNumber: serial_num_str, error: "Metadata URI not found from IPFS upload." });
            setMintingProgress(prev => ({ ...prev, current: prev.current + 1 })); // Update progress even on failure
            continue;
        }

        try {
          const tokenId = parseInt(serial_num_str);
          if (isNaN(tokenId)) {
            throw new Error(`Invalid tokenId: '${serial_num_str}' is not a valid number. Token IDs must be numeric.`);
          }

          // Based on latest tokenize.sol, it's `mintToken(address to, uint256 serialNumber)`
          const tx = await contract.mintToken(walletAddress, tokenId); 

          await tx.wait(); // Wait for the transaction to be mined

          successfulMints.push({ serialNumber: serial_num_str, transactionHash: tx.hash });
          console.log(`Minted token ${serial_num_str}. Tx Hash: ${tx.hash}`);

        } catch (error: any) {
          console.error(`Error minting token ${serial_num_str}:`, error);
          let errorMessage = error.message;
          if (error.code === 4001) {
              errorMessage = "Transaction rejected by user in MetaMask.";
          } else if (error.data && error.data.message) {
              errorMessage = error.data.message;
          }
          failedMints.push({ serialNumber: serial_num_str, error: errorMessage });
        } finally {
            setMintingProgress(prev => ({ ...prev, current: prev.current + 1 })); // Always update progress
        }
      }

      if (successfulMints.length > 0) {
        setMintingProgress(prev => ({ ...prev, isActive: false })); // Stop progress animation
        toast({
          title: "NFTs minted successfully",
          description: `Successfully minted ${successfulMints.length} out of ${carbonCreditDataList.length} tokens!`,
          variant: "default",
        });
        setCurrentStep(4); // Move to collection step after minting
      }

      if (failedMints.length > 0) {
        toast({
          title: "Partial Minting Success",
          description: `${failedMints.length} tokens failed to mint. Check console for details.`,
          variant: "destructive",
        });
        setMintingProgress(prev => ({ ...prev, isActive: false })); // Stop progress animation
        if (successfulMints.length === 0) {
            setMintingProgress(prev => ({ ...prev, isActive: false })); // Stop progress animation
            // If all failed, stay on step 3 or move to a specific error step
            // For now, let's keep it on step 3 to show the failure state
        } else {
            setCurrentStep(4); // Move to collection step if at least some succeeded
        }
      }

      if (successfulMints.length === 0 && failedMints.length > 0) {
          // If all failed, set status to failed and keep on step 3
          setMintingProgress(prev => ({ ...prev, isActive: false }));
          // No need to change step, stay on 3 to show failure
      }


    } catch (error) {
      console.error('Critical error during minting process:', error);
      setMintingProgress(prev => ({ ...prev, isActive: false }));
      toast({
        title: "Minting Process Failed",
        description: "An unexpected error occurred during the minting process. Check console.",
        variant: "destructive",
      });
      // Stay on step 3 to show the error
    }
  };

  const resetProcess = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setSelectedRows(new Set());
    setCurrentStep(1);
    setCollectionConfig({
      name: '',
      symbol: '',
      description: '',
      maxSupply: 1000
    });
    setMintingProgress({ current: 0, total: 0, isActive: false });
    // Keep wallet connected if it was connected
  };

  // Define the steps for the progress indicator
  const steps = [
    { number: 1, title: 'Upload File', icon: Upload },
    { number: 2, title: 'Review Data', icon: FileText },
    { number: 3, title: 'Mint NFTs', icon: Coins },
    { number: 4, title: 'Create Collection', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent/20">
      <div className="container px-4 py-16 mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            <span className="text-primary">Afri</span>
            <span className="text-secondary">coin</span>
          </h1>
          {/* WalletConnect component, passing props for connection status */}
          <WalletConnect
            onConnect={handleWalletConnect} // Pass the updated handler
            onDisconnect={handleWalletDisconnect} // Pass the updated handler
            connected={isConnected} // Use your existing isConnected state
            currentAddress={walletAddress} // Use your existing walletAddress state
          />
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Issue New Carbon Credits
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simply upload your CSV or Excel file with serial numbers and geographic coordinates, and we'll mint unique NFTs for each row.
            </p>
          </div>

          {/* Progress Steps Indicator */}
          <div className="flex justify-center mb-12 mt-8">
            <div className="flex space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-sm mt-2 ${
                        isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mt-6 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditional Rendering based on currentStep */}

          {/* Step 1: File Upload */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Upload Your Carbon Credit Data
                </h2>
                <p className="text-gray-600">
                  Support for CSV and Excel files (.csv, .xlsx, .xls)
                </p>
              </div>
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
          )}

          {/* Step 2: Data Preview */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Review Your Data
                  </h2>
                  <p className="text-gray-600">
                    {csvData.length} records found
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    {selectedRows.size === csvData.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === csvData.length && csvData.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      {csvHeaders.map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((row, index) => (
                      <tr key={index} className={`border-t ${selectedRows.has(index) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(index)}
                            onChange={() => handleRowSelection(index)}
                            className="w-4 h-4"
                          />
                        </td>
                        {csvHeaders.map((header, colIndex) => (
                          <td key={colIndex} className="px-4 py-3 text-sm text-gray-900">
                            {String(row[header])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={mintIndividualNFTs} // Call the new minting function
                  disabled={selectedRows.size === 0 || !isConnected || mintingProgress.isActive}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                    selectedRows.size === 0 || !isConnected || mintingProgress.isActive
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {mintingProgress.isActive ? 'Minting...' : `Mint ${selectedRows.size} NFTs`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Minting NFTs */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Minting Individual NFTs
                </h2>

                {mintingProgress.isActive ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <p className="text-lg text-gray-600">
                      Minting {mintingProgress.current} of {mintingProgress.total} NFTs on the blockchain...
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      This may take a few moments
                    </p>
                  </div>
                ) : (
                  // Display success or failure based on last minting attempt
                  mintingProgress.current === mintingProgress.total ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                      <p className="text-lg text-gray-800 mb-4">
                        Successfully minted {mintingProgress.total} NFTs!
                      </p>
                      <button
                        // This button would trigger the 'Create Collection' step if applicable
                        // For now, it's a placeholder
                        onClick={() => setCurrentStep(4)}
                        className="px-8 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold"
                      >
                        Create Collection
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Trash2 className="w-16 h-16 text-red-500 mb-4" />
                      <p className="text-lg text-gray-800 mb-4">
                        NFT minting failed or was incomplete.
                      </p>
                      <button
                        onClick={resetProcess}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Step 4: Collection Creation (Placeholder) */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Collection Creation (Future Feature)
                </h2>
                <p className="text-lg text-gray-600">
                  This step will allow you to create a new NFT collection or manage existing ones.
                </p>
                <button
                  onClick={resetProcess}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-6"
                >
                  Mint Another Batch
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
