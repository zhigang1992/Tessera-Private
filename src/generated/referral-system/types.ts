/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/referral_system.json`.
 */
export type ReferralSystem = {
  address: '5jSqXLX7QFr6ZvvQPLRH7mGhw9P3r96uarkVLy7NEdog'
  metadata: {
    name: 'referralSystem'
    version: '0.1.0'
    spec: '0.1.0'
    description: 'Solana referral system with fee reduction and splitting'
  }
  instructions: [
    {
      name: 'adminBatchCreateReferralCodes'
      docs: [
        'Admin: Batch create referral codes for multiple owners',
        'Only the program authority can batch create referral codes',
      ]
      discriminator: [250, 229, 195, 204, 33, 130, 222, 23]
      accounts: [
        {
          name: 'referralConfig'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'authority'
          writable: true
          signer: true
        },
        {
          name: 'payer'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'codes'
          type: {
            vec: 'string'
          }
        },
        {
          name: 'owners'
          type: {
            vec: 'pubkey'
          }
        },
      ]
    },
    {
      name: 'adminBatchRegisterWithReferralCode'
      docs: [
        'Admin: Batch register multiple users with referral codes',
        'Only the program authority can batch register users',
      ]
      discriminator: [157, 52, 84, 105, 208, 158, 12, 66]
      accounts: [
        {
          name: 'referralConfig'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'authority'
          writable: true
          signer: true
        },
        {
          name: 'payer'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'users'
          type: {
            vec: 'pubkey'
          }
        },
        {
          name: 'referralCodeKeys'
          type: {
            vec: 'pubkey'
          }
        },
      ]
    },
    {
      name: 'adminCreateReferralCode'
      docs: [
        'Admin: Create a referral code for a specified owner address',
        'Only the program authority can create referral codes on behalf of users',
      ]
      discriminator: [41, 77, 118, 47, 67, 246, 221, 165]
      accounts: [
        {
          name: 'referralCode'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 100, 101]
              },
              {
                kind: 'arg'
                path: 'code'
              },
            ]
          }
        },
        {
          name: 'referralConfig'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'authority'
          writable: true
          signer: true
        },
        {
          name: 'payer'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'code'
          type: 'string'
        },
        {
          name: 'owner'
          type: 'pubkey'
        },
      ]
    },
    {
      name: 'adminRegisterWithReferralCode'
      docs: [
        'Admin: Register a user with a referral code',
        'Only the program authority can register users on their behalf',
      ]
      discriminator: [146, 231, 86, 12, 251, 124, 243, 187]
      accounts: [
        {
          name: 'referralCode'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 100, 101]
              },
              {
                kind: 'account'
                path: 'referral_code.code'
                account: 'referralCode'
              },
            ]
          }
        },
        {
          name: 'userRegistration'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [117, 115, 101, 114, 95, 114, 101, 103, 105, 115, 116, 114, 97, 116, 105, 111, 110]
              },
              {
                kind: 'arg'
                path: 'user'
              },
            ]
          }
        },
        {
          name: 'referralConfig'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'tokenAuthority'
          docs: ['Token authority PDA that signs CPIs to Tessera Token program']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 111, 107, 101, 110, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121]
              },
              {
                kind: 'account'
                path: 'referralConfig'
              },
            ]
          }
        },
        {
          name: 'referrerRegistration'
          docs: ["Optional: The direct referrer's UserRegistration (if they exist in the system)"]
          optional: true
        },
        {
          name: 'whitelistEntry'
          docs: ['The whitelist entry account in the Tessera Token program']
          writable: true
        },
        {
          name: 'userAccount'
          docs: ['The user account to register']
        },
        {
          name: 'tesseraMint'
          docs: ['The Tessera Token mint']
        },
        {
          name: 'tesseraTokenProgram'
          docs: ['The Tessera Token program']
        },
        {
          name: 'authority'
          writable: true
          signer: true
        },
        {
          name: 'payer'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'user'
          type: 'pubkey'
        },
      ]
    },
    {
      name: 'createReferralCode'
      docs: ['Create a referral code for an owner', 'Only the program caller (owner) can create referral codes']
      discriminator: [206, 2, 37, 2, 193, 190, 203, 191]
      accounts: [
        {
          name: 'referralCode'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 100, 101]
              },
              {
                kind: 'arg'
                path: 'code'
              },
            ]
          }
        },
        {
          name: 'owner'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'code'
          type: 'string'
        },
      ]
    },
    {
      name: 'deactivateReferralCode'
      docs: ['Deactivate a referral code (owner only)', 'Only the referral code owner can deactivate their code']
      discriminator: [210, 161, 175, 173, 126, 7, 89, 159]
      accounts: [
        {
          name: 'referralCode'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 100, 101]
              },
              {
                kind: 'account'
                path: 'referral_code.code'
                account: 'referralCode'
              },
            ]
          }
        },
        {
          name: 'owner'
          writable: true
          signer: true
          relations: ['referralCode']
        },
      ]
      args: []
    },
    {
      name: 'initializeReferralSystem'
      docs: ['Initialize the referral system with authority and configuration']
      discriminator: [63, 171, 112, 122, 51, 237, 106, 140]
      accounts: [
        {
          name: 'referralConfig'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'authority'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'tesseraTokenProgram'
          type: 'pubkey'
        },
        {
          name: 'defaultFeeReductionPercentage'
          type: 'u16'
        },
        {
          name: 'tier1SplitPercentage'
          type: 'u16'
        },
        {
          name: 'tier2SplitPercentage'
          type: 'u16'
        },
        {
          name: 'tier3SplitPercentage'
          type: 'u16'
        },
        {
          name: 'enableSplitFee'
          type: 'bool'
        },
      ]
    },
    {
      name: 'initializeTokenAuthority'
      docs: [
        'Initialize the token authority PDA',
        'This PDA will be set as the transfer fee authority on the token mint',
        'allowing the referral program to make CPI calls without requiring signatures',
      ]
      discriminator: [54, 198, 42, 77, 164, 175, 253, 107]
      accounts: [
        {
          name: 'tokenAuthority'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 111, 107, 101, 110, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121]
              },
              {
                kind: 'account'
                path: 'referralConfig'
              },
            ]
          }
        },
        {
          name: 'referralConfig'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'payer'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: []
    },
    {
      name: 'reactivateReferralCode'
      docs: ['Reactivate a referral code (owner only)']
      discriminator: [115, 6, 76, 81, 207, 228, 115, 85]
      accounts: [
        {
          name: 'referralCode'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 100, 101]
              },
              {
                kind: 'account'
                path: 'referral_code.code'
                account: 'referralCode'
              },
            ]
          }
        },
        {
          name: 'owner'
          writable: true
          signer: true
          relations: ['referralCode']
        },
      ]
      args: []
    },
    {
      name: 'registerWithReferralCode'
      docs: ['Register a user with a referral code', 'Only the program caller (user) can register themselves']
      discriminator: [53, 111, 51, 221, 37, 127, 20, 153]
      accounts: [
        {
          name: 'referralCode'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 100, 101]
              },
              {
                kind: 'account'
                path: 'referral_code.code'
                account: 'referralCode'
              },
            ]
          }
        },
        {
          name: 'userRegistration'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [117, 115, 101, 114, 95, 114, 101, 103, 105, 115, 116, 114, 97, 116, 105, 111, 110]
              },
              {
                kind: 'account'
                path: 'user'
              },
            ]
          }
        },
        {
          name: 'referralConfig'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'tokenAuthority'
          docs: ['Token authority PDA that signs CPIs to Tessera Token program']
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [116, 111, 107, 101, 110, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121]
              },
              {
                kind: 'account'
                path: 'referralConfig'
              },
            ]
          }
        },
        {
          name: 'referrerRegistration'
          docs: ["Optional: The direct referrer's UserRegistration (if they exist in the system)"]
          optional: true
        },
        {
          name: 'whitelistEntry'
          docs: ['The whitelist entry account in the Tessera Token program']
          writable: true
        },
        {
          name: 'senderFeeConfig'
          docs: ['The sender fee config account in the Tessera Token program']
          writable: true
        },
        {
          name: 'tesseraMint'
          docs: ['The mint for which to configure fees (per-mint configuration)']
        },
        {
          name: 'tesseraTokenProgram'
          docs: ['The Tessera Token program']
          address: 'TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf'
        },
        {
          name: 'user'
          writable: true
          signer: true
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: []
    },
    {
      name: 'updateReferralConfig'
      docs: ['Update referral system configuration (authority only)']
      discriminator: [129, 209, 121, 34, 163, 184, 187, 56]
      accounts: [
        {
          name: 'referralConfig'
          writable: true
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'authority'
          writable: true
          signer: true
          relations: ['referralConfig']
        },
      ]
      args: [
        {
          name: 'newFeeReductionPercentage'
          type: 'u16'
        },
        {
          name: 'newTier1SplitPercentage'
          type: 'u16'
        },
        {
          name: 'newTier2SplitPercentage'
          type: 'u16'
        },
        {
          name: 'newTier3SplitPercentage'
          type: 'u16'
        },
        {
          name: 'newEnableSplitFee'
          type: 'bool'
        },
      ]
    },
    {
      name: 'updateUserFeeConfig'
      docs: [
        'Update fee configuration for a registered user with custom parameters',
        'This allows overriding the fee configuration for specific users',
        'New registrations will use the current referral config, but existing users',
        'can be updated with custom fee reduction and split percentages',
        'Only the authority can update user fee configurations',
      ]
      discriminator: [80, 110, 233, 148, 172, 16, 154, 252]
      accounts: [
        {
          name: 'userRegistration'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [117, 115, 101, 114, 95, 114, 101, 103, 105, 115, 116, 114, 97, 116, 105, 111, 110]
              },
              {
                kind: 'account'
                path: 'user'
              },
            ]
          }
        },
        {
          name: 'referralCode'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 100, 101]
              },
              {
                kind: 'account'
                path: 'referral_code.code'
                account: 'referralCode'
              },
            ]
          }
        },
        {
          name: 'referralConfig'
          pda: {
            seeds: [
              {
                kind: 'const'
                value: [114, 101, 102, 101, 114, 114, 97, 108, 95, 99, 111, 110, 102, 105, 103]
              },
            ]
          }
        },
        {
          name: 'tesseraMint'
          docs: ['The mint for which to configure fees (per-mint configuration)']
        },
        {
          name: 'whitelistEntry'
          docs: ['The whitelist entry account in the Tessera Token program']
          writable: true
        },
        {
          name: 'senderFeeConfig'
          docs: ['The sender fee config account in the Tessera Token program']
          writable: true
        },
        {
          name: 'tesseraTokenProgram'
          docs: ['The Tessera Token program']
          address: 'TESQvsR4TmYxiroPPQgZpVRoSFG8pru4fsYr67iv6kf'
        },
        {
          name: 'authority'
          docs: [
            'The authority that can set fee configurations in Tessera Token',
            'Only the referral system authority can update user fee configurations',
          ]
          signer: true
        },
        {
          name: 'payer'
          docs: ['The payer for any account initialization']
          writable: true
          signer: true
        },
        {
          name: 'user'
          docs: ['The user whose fee configuration is being updated']
        },
        {
          name: 'systemProgram'
          address: '11111111111111111111111111111111'
        },
      ]
      args: [
        {
          name: 'feeReductionPercentage'
          type: 'u16'
        },
        {
          name: 'ownerSplitPercentage'
          type: 'u16'
        },
      ]
    },
  ]
  accounts: [
    {
      name: 'referralCode'
      discriminator: [227, 239, 247, 224, 128, 187, 44, 229]
    },
    {
      name: 'referralConfig'
      discriminator: [102, 148, 171, 235, 148, 83, 250, 140]
    },
    {
      name: 'tokenAuthority'
      discriminator: [145, 159, 9, 246, 161, 7, 193, 203]
    },
    {
      name: 'userRegistration'
      discriminator: [128, 102, 192, 182, 31, 20, 27, 194]
    },
  ]
  errors: [
    {
      code: 6000
      name: 'invalidCodeFormat'
      msg: 'Invalid referral code format. Must be 6-12 alphanumeric characters.'
    },
    {
      code: 6001
      name: 'inactiveReferralCode'
      msg: 'Referral code is not active.'
    },
    {
      code: 6002
      name: 'invalidPercentage'
      msg: 'Invalid percentage. Must be between 0 and 10000 basis points.'
    },
    {
      code: 6003
      name: 'unauthorized'
      msg: 'Unauthorized. Only the correct authority can perform this action.'
    },
    {
      code: 6004
      name: 'overflow'
      msg: 'Overflow occurred during arithmetic operation.'
    },
    {
      code: 6005
      name: 'mismatchedBatchLengths'
      msg: 'Mismatched batch lengths. Codes and owners arrays must have the same length.'
    },
    {
      code: 6006
      name: 'invalidBatchSize'
      msg: 'Invalid batch size. Must be between 1 and 10.'
    },
    {
      code: 6007
      name: 'insufficientAccounts'
      msg: 'Insufficient accounts provided for batch operation.'
    },
    {
      code: 6008
      name: 'invalidPda'
      msg: 'Invalid PDA derivation.'
    },
  ]
  types: [
    {
      name: 'referralCode'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'code'
            type: 'string'
          },
          {
            name: 'owner'
            type: 'pubkey'
          },
          {
            name: 'isActive'
            type: 'bool'
          },
          {
            name: 'totalReferrals'
            type: 'u32'
          },
          {
            name: 'bump'
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'referralConfig'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'authority'
            type: 'pubkey'
          },
          {
            name: 'tesseraTokenProgram'
            type: 'pubkey'
          },
          {
            name: 'defaultFeeReductionPercentage'
            type: 'u16'
          },
          {
            name: 'tier1SplitPercentage'
            type: 'u16'
          },
          {
            name: 'tier2SplitPercentage'
            type: 'u16'
          },
          {
            name: 'tier3SplitPercentage'
            type: 'u16'
          },
          {
            name: 'enableSplitFee'
            type: 'bool'
          },
          {
            name: 'bump'
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'tokenAuthority'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'referralConfig'
            type: 'pubkey'
          },
          {
            name: 'bump'
            type: 'u8'
          },
        ]
      }
    },
    {
      name: 'userRegistration'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'user'
            type: 'pubkey'
          },
          {
            name: 'referralCode'
            type: 'pubkey'
          },
          {
            name: 'owner'
            type: 'pubkey'
          },
          {
            name: 'tier2Referrer'
            type: 'pubkey'
          },
          {
            name: 'tier3Referrer'
            type: 'pubkey'
          },
          {
            name: 'isActive'
            type: 'bool'
          },
          {
            name: 'bump'
            type: 'u8'
          },
        ]
      }
    },
  ]
}
