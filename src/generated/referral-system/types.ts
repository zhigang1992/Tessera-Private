/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tessera_referrals.json`.
 */
export type TesseraReferrals = {
  "address": "5jSqXLX7QFr6ZvvQPLRH7mGhw9P3r96uarkVLy7NEdog",
  "metadata": {
    "name": "tesseraReferrals",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Solana referral system with fee reduction and splitting"
  },
  "instructions": [
    {
      "name": "addAdmin",
      "docs": [
        "Add an admin to the admin list"
      ],
      "discriminator": [
        177,
        236,
        33,
        205,
        124,
        152,
        55,
        186
      ],
      "accounts": [
        {
          "name": "adminList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  95,
                  108,
                  105,
                  115,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "adminCloseReferralCode",
      "docs": [
        "Admin: Close a referral code account with incorrect discriminator",
        "This is a maintenance function to clean up accounts created with wrong discriminators",
        "Only admins can close accounts, and rent is returned to the authority"
      ],
      "discriminator": [
        141,
        154,
        218,
        171,
        219,
        183,
        7,
        187
      ],
      "accounts": [
        {
          "name": "referralConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "adminList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  95,
                  108,
                  105,
                  115,
                  116
                ]
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
          "name": "referralCode",
          "docs": [
            "The referral code account to close",
            "We use UncheckedAccount and manually handle closing to avoid discriminator validation"
          ],
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "adminCreateReferralCode",
      "docs": [
        "Admin: Create a referral code for a specified owner address",
        "Only the program authority can create referral codes on behalf of users"
      ],
      "discriminator": [
        41,
        77,
        118,
        47,
        67,
        246,
        221,
        165
      ],
      "accounts": [
        {
          "name": "referralCode",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        },
        {
          "name": "referralConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "adminList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  95,
                  108,
                  105,
                  115,
                  116
                ]
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
          "name": "code",
          "type": "string"
        },
        {
          "name": "owner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "adminRegisterWithReferralCode",
      "docs": [
        "Admin: Register a user with a referral code",
        "Only the program authority can register users on their behalf"
      ],
      "discriminator": [
        146,
        231,
        86,
        12,
        251,
        124,
        243,
        187
      ],
      "accounts": [
        {
          "name": "referralCode",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "referral_code.code",
                "account": "referralCode"
              }
            ]
          }
        },
        {
          "name": "userRegistration",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "referralConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "adminList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  95,
                  108,
                  105,
                  115,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "tokenAuthority",
          "docs": [
            "Token authority PDA that signs CPIs to Tessera Token program"
          ],
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
                "path": "referralConfig"
              }
            ]
          }
        },
        {
          "name": "referrerRegistration",
          "docs": [
            "Optional: The direct referrer's UserRegistration (if they exist in the system)"
          ],
          "optional": true
        },
        {
          "name": "whitelistEntry",
          "docs": [
            "The whitelist entry account in the Tessera Token program"
          ],
          "writable": true
        },
        {
          "name": "authorizedPrograms",
          "docs": [
            "The authorized programs account from Tessera Token program",
            "This validates that the referral program is authorized to whitelist"
          ]
        },
        {
          "name": "userAccount",
          "docs": [
            "The user account to register"
          ]
        },
        {
          "name": "tesseraMint",
          "docs": [
            "The Tessera Token mint"
          ]
        },
        {
          "name": "tesseraTokenProgram",
          "docs": [
            "The Tessera Token program"
          ]
        },
        {
          "name": "authority",
          "writable": true,
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
          "name": "user",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "closeReferralConfig",
      "docs": [
        "Close the referral config account and reclaim SOL (authority only)",
        "This is useful for resetting or migrating the referral system"
      ],
      "discriminator": [
        35,
        87,
        180,
        220,
        36,
        174,
        204,
        207
      ],
      "accounts": [
        {
          "name": "referralConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createReferralCode",
      "docs": [
        "Create a referral code for an owner",
        "Only the program caller (owner) can create referral codes"
      ],
      "discriminator": [
        206,
        2,
        37,
        2,
        193,
        190,
        203,
        191
      ],
      "accounts": [
        {
          "name": "referralCode",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "code"
              }
            ]
          }
        },
        {
          "name": "owner",
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
          "name": "code",
          "type": "string"
        }
      ]
    },
    {
      "name": "deactivateReferralCode",
      "docs": [
        "Deactivate a referral code (owner only)",
        "Only the referral code owner can deactivate their code"
      ],
      "discriminator": [
        210,
        161,
        175,
        173,
        126,
        7,
        89,
        159
      ],
      "accounts": [
        {
          "name": "referralCode",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "referral_code.code",
                "account": "referralCode"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "referralCode"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeAdminList",
      "docs": [
        "Initialize the admin list"
      ],
      "discriminator": [
        202,
        155,
        78,
        226,
        91,
        128,
        203,
        83
      ],
      "accounts": [
        {
          "name": "adminList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  95,
                  108,
                  105,
                  115,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "referralConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
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
      "name": "initializeReferralSystem",
      "docs": [
        "Initialize the referral system with authority and configuration"
      ],
      "discriminator": [
        63,
        171,
        112,
        122,
        51,
        237,
        106,
        140
      ],
      "accounts": [
        {
          "name": "referralConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
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
      "args": [
        {
          "name": "tesseraTokenProgram",
          "type": "pubkey"
        },
        {
          "name": "defaultFeeReductionPercentage",
          "type": "u16"
        },
        {
          "name": "tier1SplitPercentage",
          "type": "u16"
        },
        {
          "name": "tier2SplitPercentage",
          "type": "u16"
        },
        {
          "name": "tier3SplitPercentage",
          "type": "u16"
        }
      ]
    },
    {
      "name": "initializeTokenAuthority",
      "docs": [
        "Initialize the token authority PDA",
        "This PDA will be used to sign CPI calls to the Tessera Token program",
        "The referral program will be added to the token program's authorized_programs list"
      ],
      "discriminator": [
        54,
        198,
        42,
        77,
        164,
        175,
        253,
        107
      ],
      "accounts": [
        {
          "name": "tokenAuthority",
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
                "path": "referralConfig"
              }
            ]
          }
        },
        {
          "name": "referralConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
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
      "args": []
    },
    {
      "name": "reactivateReferralCode",
      "docs": [
        "Reactivate a referral code (owner only)"
      ],
      "discriminator": [
        115,
        6,
        76,
        81,
        207,
        228,
        115,
        85
      ],
      "accounts": [
        {
          "name": "referralCode",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "referral_code.code",
                "account": "referralCode"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "referralCode"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "registerWithReferralCode",
      "docs": [
        "Register a user with a referral code",
        "Only the program caller (user) can register themselves"
      ],
      "discriminator": [
        53,
        111,
        51,
        221,
        37,
        127,
        20,
        153
      ],
      "accounts": [
        {
          "name": "referralCode",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  100,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "referral_code.code",
                "account": "referralCode"
              }
            ]
          }
        },
        {
          "name": "userRegistration",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "referralConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "tokenAuthority",
          "docs": [
            "Token authority PDA that signs CPIs to Tessera Token program"
          ],
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
                "path": "referralConfig"
              }
            ]
          }
        },
        {
          "name": "referrerRegistration",
          "docs": [
            "Optional: The direct referrer's UserRegistration (if they exist in the system)"
          ],
          "optional": true
        },
        {
          "name": "whitelistEntry",
          "docs": [
            "The whitelist entry account in the Tessera Token program"
          ],
          "writable": true
        },
        {
          "name": "authorizedPrograms",
          "docs": [
            "The authorized programs account from Tessera Token program",
            "This validates that the referral program is authorized to whitelist"
          ]
        },
        {
          "name": "senderFeeConfig",
          "docs": [
            "The sender fee config account in the Tessera Token program"
          ],
          "writable": true
        },
        {
          "name": "tesseraMint",
          "docs": [
            "The mint for which to configure fees (per-mint configuration)"
          ]
        },
        {
          "name": "treasuryConfig",
          "docs": [
            "The treasury config from tessera-token program",
            "This provides the default treasury address for remaining fee percentage"
          ],
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
                "path": "tesseraMint"
              }
            ],
            "program": {
              "kind": "account",
              "path": "tesseraTokenProgram"
            }
          }
        },
        {
          "name": "tesseraTokenProgram",
          "docs": [
            "The Tessera Token program"
          ],
          "address": "TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf"
        },
        {
          "name": "user",
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
      "name": "removeAdmin",
      "docs": [
        "Remove an admin from the admin list"
      ],
      "discriminator": [
        74,
        202,
        71,
        106,
        252,
        31,
        72,
        183
      ],
      "accounts": [
        {
          "name": "adminList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110,
                  95,
                  108,
                  105,
                  115,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "adminToRemove",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateReferralConfig",
      "docs": [
        "Update referral system configuration (authority only)"
      ],
      "discriminator": [
        129,
        209,
        121,
        34,
        163,
        184,
        187,
        56
      ],
      "accounts": [
        {
          "name": "referralConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  102,
                  101,
                  114,
                  114,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "referralConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newFeeReductionPercentage",
          "type": "u16"
        },
        {
          "name": "newTier1SplitPercentage",
          "type": "u16"
        },
        {
          "name": "newTier2SplitPercentage",
          "type": "u16"
        },
        {
          "name": "newTier3SplitPercentage",
          "type": "u16"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "adminList",
      "discriminator": [
        253,
        56,
        210,
        167,
        203,
        37,
        230,
        165
      ]
    },
    {
      "name": "referralCode",
      "discriminator": [
        227,
        239,
        247,
        224,
        128,
        187,
        44,
        229
      ]
    },
    {
      "name": "referralConfig",
      "discriminator": [
        102,
        148,
        171,
        235,
        148,
        83,
        250,
        140
      ]
    },
    {
      "name": "tokenAuthority",
      "discriminator": [
        145,
        159,
        9,
        246,
        161,
        7,
        193,
        203
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
      "name": "userRegistration",
      "discriminator": [
        128,
        102,
        192,
        182,
        31,
        20,
        27,
        194
      ]
    }
  ],
  "events": [
    {
      "name": "referralCodeCreated",
      "discriminator": [
        44,
        209,
        117,
        94,
        160,
        41,
        194,
        104
      ]
    },
    {
      "name": "referralCodeStatusChanged",
      "discriminator": [
        134,
        207,
        51,
        234,
        66,
        73,
        0,
        37
      ]
    },
    {
      "name": "userRegistered",
      "discriminator": [
        21,
        42,
        216,
        163,
        99,
        51,
        200,
        222
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidCodeFormat",
      "msg": "Invalid referral code format. Must be 6-12 alphanumeric characters."
    },
    {
      "code": 6001,
      "name": "inactiveReferralCode",
      "msg": "Referral code is not active."
    },
    {
      "code": 6002,
      "name": "invalidPercentage",
      "msg": "Invalid percentage. Must be between 0 and 10000 basis points."
    },
    {
      "code": 6003,
      "name": "unauthorized",
      "msg": "Unauthorized. Only the correct authority can perform this action."
    },
    {
      "code": 6004,
      "name": "overflow",
      "msg": "Overflow occurred during arithmetic operation."
    },
    {
      "code": 6005,
      "name": "adminListFull",
      "msg": "Admin list is full. Maximum 10 admins allowed."
    },
    {
      "code": 6006,
      "name": "adminAlreadyExists",
      "msg": "Admin already exists in the list."
    },
    {
      "code": 6007,
      "name": "cannotRemovePrimaryAuthority",
      "msg": "Cannot remove the primary authority from the admin list."
    },
    {
      "code": 6008,
      "name": "adminNotFound",
      "msg": "Admin not found in the list."
    },
    {
      "code": 6009,
      "name": "accountNotInitialized",
      "msg": "Account is not initialized."
    },
    {
      "code": 6010,
      "name": "invalidDiscriminator",
      "msg": "Invalid account discriminator. Account type mismatch."
    }
  ],
  "types": [
    {
      "name": "adminList",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "admins",
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
      "name": "referralCode",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "code",
            "type": "string"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "totalReferrals",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "referralCodeCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "code",
            "type": "string"
          },
          {
            "name": "owner",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "referralCodeStatusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "code",
            "type": "string"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "referralConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tesseraTokenProgram",
            "type": "pubkey"
          },
          {
            "name": "defaultFeeReductionPercentage",
            "type": "u16"
          },
          {
            "name": "tier1SplitPercentage",
            "type": "u16"
          },
          {
            "name": "tier2SplitPercentage",
            "type": "u16"
          },
          {
            "name": "tier3SplitPercentage",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "tokenAuthority",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "referralConfig",
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
      "name": "userRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "referralCode",
            "type": "string"
          },
          {
            "name": "referralCodeKey",
            "type": "pubkey"
          },
          {
            "name": "tier1Referrer",
            "type": "pubkey"
          },
          {
            "name": "tier2Referrer",
            "type": "pubkey"
          },
          {
            "name": "tier3Referrer",
            "type": "pubkey"
          },
          {
            "name": "isNewRegistration",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "userRegistration",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "referralCode",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tier2Referrer",
            "type": "pubkey"
          },
          {
            "name": "tier3Referrer",
            "type": "pubkey"
          },
          {
            "name": "isActive",
            "type": "bool"
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
