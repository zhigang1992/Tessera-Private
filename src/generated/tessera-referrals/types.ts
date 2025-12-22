/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tessera_referrals.json`.
 */
export type TesseraReferrals = {
  "address": "HiA4mhg5viZhiPHsJg2rEo2B5L2TNnNkwDi6AzCT9eD4",
  "metadata": {
    "name": "tesseraReferrals",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Solana referral system with fee reduction and splitting"
  },
  "instructions": [
    {
      "name": "addAdmin",
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
          "signer": true,
          "relations": [
            "referralConfig"
          ]
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
          "name": "admin",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "adminCreateReferralCode",
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
          "name": "admin",
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
          "docs": [
            "User registration (mint-agnostic)"
          ],
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
          "name": "referrerRegistration",
          "docs": [
            "The direct referrer's registration (if they exist in the system)"
          ],
          "optional": true
        },
        {
          "name": "senderFeeConfig",
          "docs": [
            "Sender fee config account (mint-agnostic)"
          ],
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
                "kind": "arg",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "adminList",
          "docs": [
            "The admin list account for authorization"
          ],
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
          "name": "admin",
          "docs": [
            "The signer must be in the admin list"
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
          "name": "user",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "closeAdminList",
      "discriminator": [
        31,
        89,
        118,
        122,
        34,
        2,
        21,
        235
      ],
      "accounts": [
        {
          "name": "adminList",
          "docs": [
            "This allows us to close accounts with outdated/incompatible structures"
          ],
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
          "signer": true,
          "relations": [
            "referralConfig"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "closeReferralConfig",
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
          "signer": true,
          "relations": [
            "referralConfig"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "createReferralCode",
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
          "signer": true,
          "relations": [
            "referralCode"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeReferralSystem",
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
          "name": "defaultFeeRecipient",
          "type": "pubkey"
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
      "name": "reactivateReferralCode",
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
          "docs": [
            "User registration (mint-agnostic)"
          ],
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
          "name": "referrerRegistration",
          "docs": [
            "The direct referrer's registration (if they exist in the system)"
          ],
          "optional": true
        },
        {
          "name": "senderFeeConfig",
          "docs": [
            "Sender fee config account (mint-agnostic)"
          ],
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
                "path": "user"
              }
            ]
          }
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
          "signer": true,
          "relations": [
            "referralConfig"
          ]
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
      "name": "updateAuthority",
      "discriminator": [
        32,
        46,
        64,
        28,
        149,
        75,
        243,
        88
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
          "signer": true,
          "relations": [
            "referralConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateDefaultFeeRecipient",
      "discriminator": [
        209,
        214,
        57,
        215,
        193,
        198,
        59,
        221
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
          "signer": true,
          "relations": [
            "referralConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newDefaultFeeRecipient",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateReferralConfig",
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
          "signer": true,
          "relations": [
            "referralConfig"
          ]
        }
      ],
      "args": [
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
      "name": "adminAdded",
      "discriminator": [
        23,
        13,
        37,
        90,
        130,
        53,
        75,
        251
      ]
    },
    {
      "name": "adminRemoved",
      "discriminator": [
        59,
        133,
        36,
        27,
        156,
        79,
        75,
        146
      ]
    },
    {
      "name": "authorityTransferred",
      "discriminator": [
        245,
        109,
        179,
        54,
        135,
        92,
        22,
        64
      ]
    },
    {
      "name": "defaultFeeRecipientUpdated",
      "discriminator": [
        129,
        122,
        101,
        71,
        40,
        93,
        119,
        246
      ]
    },
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
      "name": "tierPercentagesUpdated",
      "discriminator": [
        138,
        114,
        54,
        155,
        120,
        44,
        184,
        233
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
      "name": "cannotUseSelfReferralCode",
      "msg": "Cannot use your own referral code."
    },
    {
      "code": 6003,
      "name": "userAlreadyRegistered",
      "msg": "User is already registered."
    },
    {
      "code": 6004,
      "name": "invalidPercentage",
      "msg": "Invalid percentage. Must be between 0 and 10000 (0-100%)."
    },
    {
      "code": 6005,
      "name": "unauthorized",
      "msg": "Unauthorized: Signer is not the authority."
    },
    {
      "code": 6006,
      "name": "accountNotInitialized",
      "msg": "Account is not initialized."
    },
    {
      "code": 6007,
      "name": "invalidDiscriminator",
      "msg": "Invalid discriminator."
    },
    {
      "code": 6008,
      "name": "adminAlreadyExists",
      "msg": "Admin already exists in the list."
    },
    {
      "code": 6009,
      "name": "adminNotFound",
      "msg": "Admin not found in the list."
    },
    {
      "code": 6010,
      "name": "overflow",
      "msg": "Overflow in calculation."
    },
    {
      "code": 6011,
      "name": "adminListFull",
      "msg": "Admin list is full. Maximum admins reached."
    },
    {
      "code": 6012,
      "name": "cannotRemovePrimaryAuthority",
      "msg": "Cannot remove the primary authority from the admin list."
    },
    {
      "code": 6013,
      "name": "cannotRemoveLastAdmin",
      "msg": "Cannot remove the last admin. At least one admin must remain."
    },
    {
      "code": 6014,
      "name": "invalidDefaultRecipient",
      "msg": "Invalid default fee recipient. Cannot be the default pubkey."
    },
    {
      "code": 6015,
      "name": "tooManyFeeRecipients",
      "msg": "Too many fee recipients. Maximum exceeded."
    }
  ],
  "types": [
    {
      "name": "adminAdded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "addedBy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "adminList",
      "docs": [
        "Admin list for privileged operations"
      ],
      "type": {
        "kind": "struct",
        "fields": [
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
      "name": "adminRemoved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "removedBy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "authorityTransferred",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oldAuthority",
            "type": "pubkey"
          },
          {
            "name": "newAuthority",
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
      "name": "defaultFeeRecipientUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oldRecipient",
            "type": "pubkey"
          },
          {
            "name": "newRecipient",
            "type": "pubkey"
          },
          {
            "name": "updatedBy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "feeRecipientInfo",
      "docs": [
        "Fee recipient information for distributing fees"
      ],
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
      "name": "referralCode",
      "docs": [
        "Referral code owned by a user"
      ],
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
      "docs": [
        "Global referral system configuration"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "defaultFeeRecipient",
            "type": "pubkey"
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
      "name": "senderFeeConfig",
      "docs": [
        "Sender-specific fee configuration for multi-tier referral distribution"
      ],
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
      "name": "tierPercentagesUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oldTier1",
            "type": "u16"
          },
          {
            "name": "newTier1",
            "type": "u16"
          },
          {
            "name": "oldTier2",
            "type": "u16"
          },
          {
            "name": "newTier2",
            "type": "u16"
          },
          {
            "name": "oldTier3",
            "type": "u16"
          },
          {
            "name": "newTier3",
            "type": "u16"
          },
          {
            "name": "updatedBy",
            "type": "pubkey"
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
      "docs": [
        "User registration with referral chain"
      ],
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
            "name": "registrationDate",
            "type": "i64"
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

// Backwards compatibility alias
export type ReferralSystem = TesseraReferrals;

