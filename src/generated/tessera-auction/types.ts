/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tessera_auction.json`.
 */
export type TesseraAuction = {
  "address": "4Edp1p2soByRisvWP7SUA6dmfeZLHqa3UCCsoPm1Ak5R",
  "metadata": {
    "name": "tesseraAuction",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Uniform Price Auction for Tessera Token"
  },
  "docs": [
    "Uniform Price Auction for token distribution",
    "",
    "Features:",
    "- Sealed bid auction with uniform clearing price",
    "- Two-phase process: bidding collection, then auction execution",
    "- Anti-sniping: bids extend timer to prevent last-minute manipulation",
    "- Configurable bid limits and anti-whale protections",
    "- Transparent on-chain settlement with refunds for overbids"
  ],
  "instructions": [
    {
      "name": "cancelAuction",
      "docs": [
        "Emergency function to cancel auction before finalization",
        "Only callable by authority"
      ],
      "discriminator": [
        156,
        43,
        197,
        110,
        218,
        105,
        143,
        182
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "claimTokens",
      "docs": [
        "Claim tokens and refund for a winning bid",
        "",
        "Winners receive:",
        "- Tokens at clearing price",
        "- Refund if they bid above clearing price",
        "",
        "Losers receive:",
        "- Full refund of payment"
      ],
      "discriminator": [
        108,
        216,
        210,
        231,
        0,
        212,
        42,
        64
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "bid",
          "writable": true
        },
        {
          "name": "bidder",
          "writable": true,
          "signer": true
        },
        {
          "name": "bidderTokenAccount",
          "writable": true
        },
        {
          "name": "bidderPaymentAccount",
          "writable": true
        },
        {
          "name": "tokenVault",
          "writable": true
        },
        {
          "name": "paymentVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "emergencyWithdrawTokens",
      "docs": [
        "Emergency: Withdraw tokens from vault if auction is cancelled or failed",
        "",
        "Safety mechanism to recover tokens if:",
        "- Wrong amount was transferred",
        "- Auction was cancelled before completion",
        "- Auction failed (not enough bids)",
        "",
        "Only callable by authority when auction is in Cancelled or Failed state."
      ],
      "discriminator": [
        8,
        191,
        62,
        11,
        213,
        158,
        8,
        229
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "authorityTokenAccount",
          "writable": true
        },
        {
          "name": "tokenVault",
          "writable": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "finalizeAuction",
      "docs": [
        "Finalize the auction after all bids are processed",
        "",
        "Called after all process_bids batches complete.",
        "Verifies allocation and sets final state."
      ],
      "discriminator": [
        220,
        209,
        175,
        193,
        57,
        132,
        241,
        168
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeAuction",
      "docs": [
        "Initialize a new auction",
        "",
        "Parameters:",
        "- starting_price: Initial minimum price per token (in payment token units)",
        "- min_bid_quantity: Minimum tokens per bid (determines max winners)",
        "- min_bid_increment: Minimum price increase for competitive bids",
        "- max_bid_per_wallet: Maximum tokens any single wallet can bid for",
        "- bidding_duration: Duration of Phase 1 (bidding) in seconds",
        "- auction_duration: Duration of Phase 2 (auction/clearing) in seconds",
        "- anti_snipe_extension: Time extension per bid near end (e.g., 120s)",
        "- total_token_supply: Total tokens to auction"
      ],
      "discriminator": [
        37,
        10,
        117,
        197,
        208,
        88,
        117,
        62
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "paymentMint"
        },
        {
          "name": "tokenVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "auction"
              }
            ]
          }
        },
        {
          "name": "paymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "auction"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "startingPrice",
          "type": "u64"
        },
        {
          "name": "minBidQuantity",
          "type": "u64"
        },
        {
          "name": "minBidIncrement",
          "type": "u64"
        },
        {
          "name": "maxBidPerWallet",
          "type": "u64"
        },
        {
          "name": "biddingDuration",
          "type": "i64"
        },
        {
          "name": "auctionDuration",
          "type": "i64"
        },
        {
          "name": "antiSnipeExtension",
          "type": "i64"
        },
        {
          "name": "totalTokenSupply",
          "type": "u64"
        }
      ]
    },
    {
      "name": "placeBid",
      "docs": [
        "Place or update a bid during Phase 1 (Bidding)",
        "",
        "Users can:",
        "- Place initial bid",
        "- Increase bid price or quantity",
        "- Withdraw bid if not yet in winning range",
        "",
        "Once auction Phase 2 starts, bids may get evicted if outbid"
      ],
      "discriminator": [
        238,
        77,
        148,
        91,
        200,
        151,
        92,
        146
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "bid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  105,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "auction"
              },
              {
                "kind": "account",
                "path": "bidder"
              }
            ]
          }
        },
        {
          "name": "bidder",
          "writable": true,
          "signer": true
        },
        {
          "name": "bidderPaymentAccount",
          "writable": true
        },
        {
          "name": "paymentVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "pricePerToken",
          "type": "u64"
        },
        {
          "name": "tokenQuantity",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processBids",
      "docs": [
        "Process bids in batches to calculate clearing price",
        "",
        "This is called multiple times to process all bids in batches.",
        "Each call processes up to 20 bids from remaining_accounts.",
        "",
        "Algorithm:",
        "1. Load bids from remaining accounts",
        "2. Sort by price (desc) then timestamp (asc)",
        "3. Fill bids until tokens exhausted",
        "4. Update bid accounts with filled_quantity",
        "5. Track clearing price"
      ],
      "discriminator": [
        204,
        198,
        103,
        204,
        43,
        89,
        134,
        101
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "refundCancelledBid",
      "docs": [
        "Refund all bidders if auction is cancelled",
        "",
        "Can be called by anyone to help process refunds when auction is cancelled.",
        "Processes one bidder at a time to stay within compute limits."
      ],
      "discriminator": [
        51,
        92,
        229,
        67,
        58,
        209,
        168,
        196
      ],
      "accounts": [
        {
          "name": "auction"
        },
        {
          "name": "bid",
          "writable": true
        },
        {
          "name": "bidderPaymentAccount",
          "writable": true
        },
        {
          "name": "paymentVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "verifyVaultBalance",
      "docs": [
        "Verify token vault has correct mint and balance before starting auction",
        "",
        "This MUST be called after funding the vault and before bidding starts.",
        "Prevents auctions from starting with wrong token amounts or wrong tokens.",
        "",
        "Validates:",
        "1. Vault mint matches auction token_mint",
        "2. Vault has sufficient balance (>= total_token_supply)",
        "3. Vault authority is the auction PDA"
      ],
      "discriminator": [
        76,
        108,
        194,
        128,
        111,
        17,
        91,
        83
      ],
      "accounts": [
        {
          "name": "auction"
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "tokenVault"
        }
      ],
      "args": []
    },
    {
      "name": "withdrawBid",
      "docs": [
        "Withdraw a bid during Phase 1, or if outbid in Phase 2",
        "",
        "Restrictions:",
        "- Can always withdraw in Phase 1 (Bidding)",
        "- In Phase 2, can only withdraw if bid is no longer in winning range"
      ],
      "discriminator": [
        110,
        53,
        157,
        195,
        147,
        100,
        110,
        73
      ],
      "accounts": [
        {
          "name": "auction",
          "writable": true
        },
        {
          "name": "bid",
          "writable": true
        },
        {
          "name": "bidder",
          "writable": true,
          "signer": true
        },
        {
          "name": "bidderPaymentAccount",
          "writable": true
        },
        {
          "name": "paymentVault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "auction",
      "discriminator": [
        218,
        94,
        247,
        242,
        126,
        233,
        131,
        81
      ]
    },
    {
      "name": "bid",
      "discriminator": [
        143,
        246,
        48,
        245,
        42,
        145,
        180,
        88
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidPhase",
      "msg": "Auction is not in the correct phase"
    },
    {
      "code": 6001,
      "name": "auctionEnded",
      "msg": "Auction has already ended"
    },
    {
      "code": 6002,
      "name": "auctionNotEnded",
      "msg": "Auction has not ended yet"
    },
    {
      "code": 6003,
      "name": "alreadyFinalized",
      "msg": "Auction has already been finalized"
    },
    {
      "code": 6004,
      "name": "notFinalized",
      "msg": "Auction has not been finalized"
    },
    {
      "code": 6005,
      "name": "bidTooLow",
      "msg": "Bid price is below starting price"
    },
    {
      "code": 6006,
      "name": "quantityTooSmall",
      "msg": "Bid quantity is below minimum"
    },
    {
      "code": 6007,
      "name": "quantityTooLarge",
      "msg": "Bid quantity exceeds maximum per wallet"
    },
    {
      "code": 6008,
      "name": "incrementTooSmall",
      "msg": "Bid increment is too small"
    },
    {
      "code": 6009,
      "name": "unauthorized",
      "msg": "Unauthorized action"
    },
    {
      "code": 6010,
      "name": "alreadyFilled",
      "msg": "Bid has already been filled"
    },
    {
      "code": 6011,
      "name": "alreadyClaimed",
      "msg": "Bid has already been claimed"
    },
    {
      "code": 6012,
      "name": "mathOverflow",
      "msg": "Mathematical overflow"
    },
    {
      "code": 6013,
      "name": "invalidQuantity",
      "msg": "Invalid quantity specified"
    },
    {
      "code": 6014,
      "name": "bidStillWinning",
      "msg": "Cannot withdraw bid - still in winning range"
    },
    {
      "code": 6015,
      "name": "insufficientVaultBalance",
      "msg": "Token vault has insufficient balance"
    },
    {
      "code": 6016,
      "name": "nothingToRefund",
      "msg": "Nothing to refund"
    },
    {
      "code": 6017,
      "name": "wrongTokenMint",
      "msg": "Vault contains wrong token mint"
    },
    {
      "code": 6018,
      "name": "wrongVaultAuthority",
      "msg": "Vault has wrong authority"
    }
  ],
  "types": [
    {
      "name": "auction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Authority that can manage the auction"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "Token being auctioned"
            ],
            "type": "pubkey"
          },
          {
            "name": "paymentMint",
            "docs": [
              "Payment token (e.g., SOL, USDC)"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenVault",
            "docs": [
              "Vault holding tokens to distribute"
            ],
            "type": "pubkey"
          },
          {
            "name": "paymentVault",
            "docs": [
              "Vault collecting payments"
            ],
            "type": "pubkey"
          },
          {
            "name": "startingPrice",
            "docs": [
              "Starting price per token"
            ],
            "type": "u64"
          },
          {
            "name": "minBidQuantity",
            "docs": [
              "Minimum tokens per bid"
            ],
            "type": "u64"
          },
          {
            "name": "minBidIncrement",
            "docs": [
              "Minimum price increment in Phase 2"
            ],
            "type": "u64"
          },
          {
            "name": "maxBidPerWallet",
            "docs": [
              "Maximum tokens per wallet"
            ],
            "type": "u64"
          },
          {
            "name": "antiSnipeExtension",
            "docs": [
              "Time extension for anti-sniping"
            ],
            "type": "i64"
          },
          {
            "name": "totalTokenSupply",
            "docs": [
              "Total tokens available"
            ],
            "type": "u64"
          },
          {
            "name": "biddingStartTime",
            "docs": [
              "Phase 1 start time"
            ],
            "type": "i64"
          },
          {
            "name": "biddingEndTime",
            "docs": [
              "Phase 1 end time (auction begins)"
            ],
            "type": "i64"
          },
          {
            "name": "auctionEndTime",
            "docs": [
              "Phase 2 end time (may extend)"
            ],
            "type": "i64"
          },
          {
            "name": "phase",
            "docs": [
              "Current auction phase"
            ],
            "type": {
              "defined": {
                "name": "auctionPhase"
              }
            }
          },
          {
            "name": "totalBids",
            "docs": [
              "Total number of bids"
            ],
            "type": "u64"
          },
          {
            "name": "totalBidAmount",
            "docs": [
              "Total tokens bid for"
            ],
            "type": "u64"
          },
          {
            "name": "clearingPrice",
            "docs": [
              "Final clearing price"
            ],
            "type": "u64"
          },
          {
            "name": "tokensAllocated",
            "docs": [
              "Total tokens allocated to winners"
            ],
            "type": "u64"
          },
          {
            "name": "currentMinWinningPrice",
            "docs": [
              "Minimum winning price (updated dynamically in Phase 2)",
              "If your bid is below this, you can withdraw"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "auctionPhase",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "bidding"
          },
          {
            "name": "active"
          },
          {
            "name": "processing"
          },
          {
            "name": "finalized"
          },
          {
            "name": "failed"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "bid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bidder",
            "docs": [
              "Bidder's wallet"
            ],
            "type": "pubkey"
          },
          {
            "name": "pricePerToken",
            "docs": [
              "Price per token offered"
            ],
            "type": "u64"
          },
          {
            "name": "tokenQuantity",
            "docs": [
              "Quantity of tokens desired"
            ],
            "type": "u64"
          },
          {
            "name": "totalPayment",
            "docs": [
              "Total payment locked"
            ],
            "type": "u64"
          },
          {
            "name": "timestamp",
            "docs": [
              "When bid was placed/updated"
            ],
            "type": "i64"
          },
          {
            "name": "isFilled",
            "docs": [
              "Whether bid has been processed"
            ],
            "type": "bool"
          },
          {
            "name": "filledQuantity",
            "docs": [
              "Actual tokens allocated (may be partial)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};
