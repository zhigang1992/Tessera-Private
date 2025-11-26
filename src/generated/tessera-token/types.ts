/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tessera_token.json`.
 */
export type TesseraToken = {
  "address": "TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf",
  "metadata": {
    "name": "tesseraToken",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addWhitelistedAddress",
      "docs": [
        "Add an address to the whitelist with a custom transfer fee",
        "This data is used by the transfer hook",
        "",
        "Authorization:",
        "- Can be called by the mint's transfer fee config authority (program owner)",
        "- OR by an authorized program (e.g., referral system) if using program authority"
      ],
      "discriminator": [
        238,
        85,
        47,
        49,
        55,
        247,
        196,
        229
      ],
      "accounts": [
        {
          "name": "whitelistEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  104,
                  105,
                  116,
                  101,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "whitelistedAddress"
              }
            ]
          }
        },
        {
          "name": "whitelistedAddress",
          "docs": [
            "The address to whitelist"
          ]
        },
        {
          "name": "mint",
          "docs": [
            "The mint for which to whitelist the address"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "The authority that can add to whitelist",
            "Either the mint's transfer fee authority OR a PDA from an authorized program"
          ],
          "signer": true
        },
        {
          "name": "authorizedPrograms",
          "docs": [
            "Optional: AuthorizedPrograms account for validating program-based authority",
            "Required if authority is not the transfer fee config authority"
          ],
          "optional": true
        },
        {
          "name": "payer",
          "docs": [
            "The payer for the whitelist entry account"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "customTransferFeeBasisPoints",
          "type": "u16"
        }
      ]
    },
    {
      "name": "authorizeProgram",
      "docs": [
        "Add a program to the authorized list",
        "Only the authority can add programs"
      ],
      "discriminator": [
        75,
        26,
        98,
        253,
        17,
        11,
        56,
        121
      ],
      "accounts": [
        {
          "name": "authorizedPrograms",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  122,
                  101,
                  100,
                  95,
                  112,
                  114,
                  111,
                  103,
                  114,
                  97,
                  109,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "authorizedPrograms"
          ]
        }
      ],
      "args": [
        {
          "name": "programId",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "deauthorizeProgram",
      "docs": [
        "Remove a program from the authorized list",
        "Only the authority can remove programs"
      ],
      "discriminator": [
        147,
        240,
        123,
        211,
        65,
        232,
        242,
        123
      ],
      "accounts": [
        {
          "name": "authorizedPrograms",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  122,
                  101,
                  100,
                  95,
                  112,
                  114,
                  111,
                  103,
                  114,
                  97,
                  109,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "authorizedPrograms"
          ]
        }
      ],
      "args": [
        {
          "name": "programId",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initializeAuthorizedPrograms",
      "docs": [
        "Initialize authorized programs list for managing sender fee configs",
        "Only callable once per authority"
      ],
      "discriminator": [
        169,
        252,
        192,
        189,
        35,
        61,
        191,
        45
      ],
      "accounts": [
        {
          "name": "authorizedPrograms",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  122,
                  101,
                  100,
                  95,
                  112,
                  114,
                  111,
                  103,
                  114,
                  97,
                  109,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "authority"
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
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeExtraAccountMetaList",
      "docs": [
        "Initialize extra account metas for the transfer hook",
        "This must be called once per mint to enable the transfer hook"
      ],
      "discriminator": [
        51,
        85,
        186,
        2,
        53,
        203,
        238,
        115
      ],
      "accounts": [
        {
          "name": "mint",
          "docs": [
            "Mint with transfer hook"
          ]
        },
        {
          "name": "extraAccountMetas",
          "docs": [
            "Extra account metas PDA"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "authority",
          "docs": [
            "Transfer hook authority"
          ],
          "signer": true
        },
        {
          "name": "payer",
          "docs": [
            "Payer for account creation"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeMintWithTransferFee",
      "docs": [
        "Initialize Token-2022 mint with transfer fee extension, transfer hook, and metadata pointer",
        "This leverages Token-2022's native functionality with automatic fee collection",
        "Each mint has its own independent fee configuration"
      ],
      "discriminator": [
        170,
        5,
        122,
        242,
        120,
        73,
        22,
        54
      ],
      "accounts": [
        {
          "name": "mint",
          "docs": [
            "The Token-2022 mint to initialize with transfer fees"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "docs": [
            "The authority that can update transfer fees"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "treasuryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "feeManagerConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "feeManagerAta"
        },
        {
          "name": "whitelistEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  104,
                  105,
                  116,
                  101,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "feeManagerAta"
              }
            ]
          }
        },
        {
          "name": "extraAccountMetas",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "decimals",
          "type": "u8"
        },
        {
          "name": "transferFeeBasisPoints",
          "type": "u16"
        },
        {
          "name": "maximumFee",
          "type": "u64"
        },
        {
          "name": "treasury",
          "type": "pubkey"
        },
        {
          "name": "feeManager",
          "type": "pubkey"
        },
        {
          "name": "withdrawalThreshold",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeTreasuryConfig",
      "docs": [
        "Initialize treasury configuration for a mint",
        "This sets the default treasury address that receives fees from non-referral users"
      ],
      "discriminator": [
        42,
        221,
        143,
        37,
        13,
        169,
        92,
        98
      ],
      "accounts": [
        {
          "name": "treasuryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The mint this treasury is for"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "The authority who can update the treasury"
          ],
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "treasury",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeSenderFeeConfig",
      "docs": [
        "Remove sender fee configuration (MINT-AGNOSTIC)"
      ],
      "discriminator": [
        186,
        125,
        4,
        230,
        211,
        43,
        29,
        92
      ],
      "accounts": [
        {
          "name": "senderFeeConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "sender"
              }
            ]
          }
        },
        {
          "name": "sender",
          "docs": [
            "The sender address whose fee configuration is being removed"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "The authority that can remove sender fee config"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "authorizedPrograms",
          "docs": [
            "Required if authority is not the transfer fee config authority"
          ],
          "optional": true
        }
      ],
      "args": []
    },
    {
      "name": "removeWhitelistedAddress",
      "docs": [
        "Remove a whitelisted address, reverting it to the default transfer fee",
        "Authority can be EITHER:",
        "1. The transfer fee config authority for the mint",
        "2. A program authorized in the `authorized_programs` account"
      ],
      "discriminator": [
        45,
        233,
        186,
        76,
        203,
        76,
        29,
        185
      ],
      "accounts": [
        {
          "name": "whitelistEntry",
          "writable": true
        },
        {
          "name": "whitelistedAddress"
        },
        {
          "name": "mint",
          "docs": [
            "The Token-2022 mint"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "The authority that can remove the whitelisted address"
          ],
          "signer": true
        },
        {
          "name": "authorizedPrograms",
          "docs": [
            "Required if authority is not the transfer fee config authority"
          ],
          "optional": true
        }
      ],
      "args": []
    },
    {
      "name": "setSenderFeeRecipients",
      "docs": [
        "Set up fee recipients for a specific sender (MINT-AGNOSTIC)",
        "The same fee configuration applies to all mints for this sender"
      ],
      "discriminator": [
        56,
        231,
        39,
        64,
        251,
        168,
        197,
        220
      ],
      "accounts": [
        {
          "name": "senderFeeConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "sender"
              }
            ]
          }
        },
        {
          "name": "sender",
          "docs": [
            "The sender address for which to configure fee recipients"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "The authority that can set fee configurations"
          ],
          "signer": true
        },
        {
          "name": "payer",
          "docs": [
            "The payer for account initialization"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "authorizedPrograms",
          "docs": [
            "Required if authority is not the transfer fee config authority"
          ],
          "optional": true
        }
      ],
      "args": [
        {
          "name": "feeRecipients",
          "type": {
            "vec": {
              "defined": {
                "name": "feeRecipientInfo"
              }
            }
          }
        }
      ]
    },
    {
      "name": "transferHook",
      "docs": [
        "Transfer Hook: Called by Token-2022 during transfers",
        "Uses the official spl-transfer-hook-interface for proper integration",
        "",
        "This hook emits FEE_ATTRIBUTION events that trusted workers monitor off-chain.",
        "The workers then calculate and execute fee distributions based on these events.",
        "",
        "Token-2022 withholds fees in the RECIPIENT's account (destination).",
        "Workers monitor events to determine how much each referrer should receive."
      ],
      "discriminator": [
        105,
        37,
        101,
        197,
        75,
        251,
        102,
        26
      ],
      "accounts": [
        {
          "name": "sourceToken",
          "docs": [
            "Source token account"
          ]
        },
        {
          "name": "mint",
          "docs": [
            "Mint account"
          ]
        },
        {
          "name": "destinationToken",
          "docs": [
            "Destination token account"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Transfer authority"
          ]
        },
        {
          "name": "extraAccountMetas",
          "docs": [
            "Extra account metas account"
          ]
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
      "name": "updateFeeManager",
      "docs": [
        "Update or remove the fee manager configuration",
        "",
        "This instruction allows:",
        "- Updating fee manager address and/or withdrawal threshold (new_fee_manager = Some)",
        "- Removing fee manager entirely (new_fee_manager = None, closes account)",
        "",
        "Only the current authority (transfer_fee_config_authority) can call this.",
        "",
        "Use cases:",
        "- Rotating fee manager keypairs for security",
        "- Adjusting withdrawal thresholds based on volume",
        "- Transferring fee management to a different entity",
        "- Revoking fee manager privileges entirely"
      ],
      "discriminator": [
        156,
        165,
        67,
        60,
        47,
        30,
        69,
        153
      ],
      "accounts": [
        {
          "name": "feeManagerConfig",
          "docs": [
            "Fee manager config to update or close"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The Token-2022 mint"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Authority (must match config.authority)"
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "feeManagerConfig"
          ]
        },
        {
          "name": "oldFeeManagerAta",
          "docs": [
            "Only required when new_fee_manager is Some"
          ]
        },
        {
          "name": "oldWhitelistEntry",
          "docs": [
            "Whitelist entry for the old fee manager's ATA (to be closed if it exists)",
            "Only required when new_fee_manager is Some"
          ],
          "writable": true
        },
        {
          "name": "feeManagerAta",
          "docs": [
            "Only required when new_fee_manager is Some"
          ]
        },
        {
          "name": "whitelistEntry",
          "docs": [
            "Whitelist entry for the new fee manager's ATA",
            "Only required when new_fee_manager is Some"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  104,
                  105,
                  116,
                  101,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "feeManagerAta"
              }
            ]
          }
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newFeeManager",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "newWithdrawalThreshold",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateTransferFeeConfig",
      "docs": [
        "Update Token-2022's native transfer fee configuration",
        "Authority must be the mint's transfer fee authority"
      ],
      "discriminator": [
        167,
        83,
        107,
        237,
        1,
        210,
        249,
        1
      ],
      "accounts": [
        {
          "name": "mint",
          "docs": [
            "The Token-2022 mint"
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "The authority that can update transfer fees",
            "Must be the mint's transfer fee authority"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "newTransferFeeBasisPoints",
          "type": "u16"
        },
        {
          "name": "newMaximumFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateTreasuryConfig",
      "docs": [
        "Update treasury address (admin only)"
      ],
      "discriminator": [
        129,
        100,
        213,
        18,
        68,
        118,
        249,
        154
      ],
      "accounts": [
        {
          "name": "treasuryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "treasury_config.mint",
                "account": "treasuryConfig"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "treasuryConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newTreasury",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "withdrawToFeeManager",
      "docs": [
        "Harvest fees from recipient accounts and withdraw to fee manager",
        "",
        "This is a two-step process in one instruction:",
        "1. HARVEST: Move fees from recipient token accounts to mint",
        "2. WITHDRAW: Move fees from mint to fee manager",
        "",
        "TIERED APPROVAL:",
        "- Below threshold: Anyone can call (permissionless)",
        "- Above threshold: Requires authority signature",
        "",
        "USAGE:",
        "Pass recipient token accounts with withheld fees as remaining_accounts.",
        "The instruction will harvest from all of them, then withdraw everything."
      ],
      "discriminator": [
        50,
        93,
        60,
        24,
        94,
        71,
        66,
        61
      ],
      "accounts": [
        {
          "name": "feeManagerConfig",
          "docs": [
            "Fee manager config for this mint"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The Token-2022 mint (with withheld fees)"
          ],
          "writable": true
        },
        {
          "name": "feeManagerAta",
          "docs": [
            "The fee manager's token account (receives ALL fees)"
          ],
          "writable": true
        },
        {
          "name": "feeAuthority",
          "docs": [
            "The fee authority PDA (signs the withdrawal)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "authority",
          "docs": [
            "Optional authority signer (required if withdrawal amount > threshold)"
          ],
          "signer": true,
          "optional": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "writeTokenMetadata",
      "docs": [
        "Initialize Token-2022 metadata (write to mint)",
        "Creates UPDATEABLE metadata with authority control"
      ],
      "discriminator": [
        85,
        178,
        148,
        20,
        69,
        219,
        57,
        212
      ],
      "accounts": [
        {
          "name": "mint",
          "docs": [
            "The Token-2022 mint with metadata pointer"
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "Payer for additional rent (if needed for realloc)",
            "Also serves as the authority (mint authority)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "authorizedPrograms",
      "discriminator": [
        151,
        56,
        130,
        104,
        13,
        168,
        62,
        228
      ]
    },
    {
      "name": "feeManagerConfig",
      "discriminator": [
        99,
        247,
        250,
        235,
        28,
        147,
        0,
        190
      ]
    },
    {
      "name": "senderFeeConfig",
      "discriminator": [
        106,
        0,
        96,
        189,
        100,
        137,
        232,
        90
      ]
    },
    {
      "name": "treasuryConfig",
      "discriminator": [
        124,
        54,
        212,
        227,
        213,
        189,
        168,
        41
      ]
    },
    {
      "name": "whitelistEntry",
      "discriminator": [
        51,
        70,
        173,
        81,
        219,
        192,
        234,
        62
      ]
    }
  ],
  "events": [
    {
      "name": "feesWithdrawn",
      "discriminator": [
        234,
        15,
        0,
        119,
        148,
        241,
        40,
        21
      ]
    },
    {
      "name": "senderFeeRecipientsConfigured",
      "discriminator": [
        232,
        224,
        159,
        251,
        201,
        33,
        45,
        140
      ]
    },
    {
      "name": "transferHookExecuted",
      "discriminator": [
        187,
        164,
        179,
        224,
        22,
        91,
        19,
        0
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidFeeSplit",
      "msg": "Invalid fee split: total percentage exceeds 100%."
    },
    {
      "code": 6001,
      "name": "emptyFeeRecipients",
      "msg": "Fee recipients list cannot be empty."
    },
    {
      "code": 6002,
      "name": "tooManyFeeRecipients",
      "msg": "Too many fee recipients: maximum is 10."
    },
    {
      "code": 6003,
      "name": "programAlreadyAuthorized",
      "msg": "Program is already authorized."
    },
    {
      "code": 6004,
      "name": "programNotAuthorized",
      "msg": "Program is not authorized."
    },
    {
      "code": 6005,
      "name": "tooManyAuthorizedPrograms",
      "msg": "Too many authorized programs: maximum is 10."
    },
    {
      "code": 6006,
      "name": "invalidAuthority",
      "msg": "Invalid authority: PDA derivation mismatch."
    },
    {
      "code": 6007,
      "name": "unauthorizedWhitelist",
      "msg": "Unauthorized to whitelist: not transfer fee authority or authorized program."
    },
    {
      "code": 6008,
      "name": "invalidRecipient",
      "msg": "Invalid recipient: not in fee_recipients list or treasury."
    },
    {
      "code": 6009,
      "name": "invalidTokenAccount",
      "msg": "Invalid token account data"
    },
    {
      "code": 6010,
      "name": "invalidMintSpace",
      "msg": "Failed to calculate mint space for extensions"
    },
    {
      "code": 6011,
      "name": "unauthorizedWithdrawal",
      "msg": "Unauthorized withdrawal - amount exceeds threshold and authority signature required"
    },
    {
      "code": 6012,
      "name": "unauthorizedMintAuthority",
      "msg": "Unauthorized: must be mint authority"
    },
    {
      "code": 6013,
      "name": "unauthorizedTransferFeeAuthority",
      "msg": "Unauthorized: must be transfer fee config authority"
    }
  ],
  "types": [
    {
      "name": "authorizedPrograms",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "authorizedPrograms",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "feeManagerConfig",
      "docs": [
        "Configuration for the fee manager",
        "The fee manager receives all withheld fees and distributes them to recipients"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "docs": [
              "The mint this configuration is for"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeManager",
            "docs": [
              "The fee manager wallet address (privileged operator)",
              "This wallet receives all fees from the mint and distributes them"
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "The authority who can update this configuration"
            ],
            "type": "pubkey"
          },
          {
            "name": "withdrawalThreshold",
            "docs": [
              "Threshold for withdrawals: amounts above this require authority signature",
              "Below this threshold, anyone can withdraw to fee manager",
              "Above this threshold, only authority can approve withdrawal"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "feeRecipientInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "splitPercentage",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "feesWithdrawn",
      "docs": [
        "Event emitted when fees are withdrawn to fee manager"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "feeManager",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "senderFeeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "feeRecipients",
            "type": {
              "vec": {
                "defined": {
                  "name": "feeRecipientInfo"
                }
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "senderFeeRecipientsConfigured",
      "docs": [
        "Event emitted when sender fee recipients are configured (MINT-AGNOSTIC)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "recipientCount",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "transferHookExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "senderFeeConfigPda",
            "type": "pubkey"
          },
          {
            "name": "sendTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "senderOwner",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "treasuryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "whitelistEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "whitelistedAddress",
            "type": "pubkey"
          },
          {
            "name": "customTransferFeeBasisPoints",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
