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
        "This data is used by the transfer hook"
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
            "Must be the mint's transfer fee authority"
          ],
          "signer": true
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
      "name": "collectSplitWithheldFees",
      "docs": [
        "Collect withheld fees for senders with custom fee splits",
        "This distributes fees to all recipients according to their configured splits",
        "Useful for senders who have sender_fee_config with multiple recipients"
      ],
      "discriminator": [
        163,
        199,
        229,
        223,
        129,
        213,
        169,
        128
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
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "sender_fee_config.sender",
                "account": "senderFeeConfig"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The Token-2022 mint"
          ],
          "writable": true
        },
        {
          "name": "senderTokenAccount",
          "docs": [
            "The sender's token account (where fees are withheld)"
          ],
          "writable": true
        },
        {
          "name": "recipientTokenAccount",
          "docs": [
            "The recipient's token account (where fees will be sent)"
          ],
          "writable": true
        },
        {
          "name": "withdrawAuthority",
          "docs": [
            "The withdraw authority (program authority)"
          ],
          "signer": true
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
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
          "writable": true
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
          "name": "defaultFeeRecipient",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "monitorSenderFeeStatus",
      "docs": [
        "Monitor transfer status and fee distribution for a sender",
        "This function provides detailed information about fee distribution status"
      ],
      "discriminator": [
        168,
        32,
        190,
        243,
        56,
        160,
        218,
        109
      ],
      "accounts": [
        {
          "name": "senderFeeConfig",
          "docs": [
            "The sender fee config account"
          ],
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
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "sender_fee_config.sender",
                "account": "senderFeeConfig"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The mint for which to monitor the sender fee status"
          ]
        },
        {
          "name": "senderTokenAccount",
          "docs": [
            "The sender's token account (where fees are withheld)"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "removeSenderFeeConfig",
      "docs": [
        "Remove sender fee configuration"
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
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "sender"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The mint for which to remove the sender fee configuration"
          ]
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
            "The authority that can remove sender fee config",
            "Must be the mint's transfer fee authority"
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "removeWhitelistedAddress",
      "docs": [
        "Remove an address from the whitelist"
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
            "The address to remove from whitelist"
          ],
          "relations": [
            "whitelistEntry"
          ]
        },
        {
          "name": "mint",
          "docs": [
            "The mint for which to remove the address from whitelist"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "The authority that can remove from whitelist",
            "Must be the mint's transfer fee authority"
          ],
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "setSenderFeeRecipients",
      "docs": [
        "Set up fee recipients for a specific sender on a specific mint"
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
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "sender"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The mint for which to configure fee recipients"
          ]
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
            "The authority that can set fee configurations",
            "Must be the mint's transfer fee authority"
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
      "name": "unauthorized",
      "msg": "Unauthorized. Only the fee config authority or authorized programs can perform this action."
    },
    {
      "code": 6004,
      "name": "programAlreadyAuthorized",
      "msg": "Program is already authorized."
    },
    {
      "code": 6005,
      "name": "programNotAuthorized",
      "msg": "Program is not authorized."
    },
    {
      "code": 6006,
      "name": "tooManyAuthorizedPrograms",
      "msg": "Too many authorized programs: maximum is 10."
    },
    {
      "code": 6007,
      "name": "alreadyDistributed",
      "msg": "Recipient has already been distributed to - double distribution prevented"
    },
    {
      "code": 6008,
      "name": "invalidTokenAccount",
      "msg": "Invalid token account data"
    },
    {
      "code": 6009,
      "name": "invalidMintSpace",
      "msg": "Failed to calculate mint space for extensions"
    },
    {
      "code": 6010,
      "name": "invalidMetadataField",
      "msg": "Invalid metadata field. Use: name, symbol, or uri"
    }
  ],
  "types": [
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
      "name": "senderFeeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
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
            "name": "distributedRecipients",
            "type": {
              "vec": "bool"
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
