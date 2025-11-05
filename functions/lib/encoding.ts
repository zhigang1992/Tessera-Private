const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE58_BASE = 58

let base58Map: Uint8Array | null = null

function getBase58Map(): Uint8Array {
  if (base58Map === null) {
    base58Map = new Uint8Array(128).fill(255)
    for (let i = 0; i < BASE58_ALPHABET.length; i += 1) {
      base58Map[BASE58_ALPHABET.charCodeAt(i)] = i
    }
  }
  return base58Map
}

export function decodeBase58(value: string): Uint8Array {
  if (value.length === 0) {
    return new Uint8Array(0)
  }

  const digits = new Uint8Array(value.length)
  let digitsLength = 0

  const map = getBase58Map()

  for (let i = 0; i < value.length; i += 1) {
    const codePoint = value.charCodeAt(i)

    if (codePoint & 0x80) {
      throw new Error('Invalid Base58 character')
    }

    const digit = map[codePoint]
    if (digit === 255) {
      throw new Error('Invalid Base58 character')
    }

    let carry = digit
    for (let j = 0; j < digitsLength; j += 1) {
      const value256 = digits[j] * BASE58_BASE + carry
      digits[j] = value256 & 0xff
      carry = value256 >> 8
    }

    while (carry > 0) {
      digits[digitsLength] = carry & 0xff
      digitsLength += 1
      carry >>= 8
    }
  }

  let leadingZeroCount = 0
  while (leadingZeroCount < value.length && value[leadingZeroCount] === '1') {
    leadingZeroCount += 1
  }

  const output = new Uint8Array(leadingZeroCount + digitsLength)
  let index = output.length - 1
  for (let i = 0; i < digitsLength; i += 1) {
    output[index] = digits[i]
    index -= 1
  }

  return output
}

export function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  const result = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    result[i] = binary.charCodeAt(i)
  }

  return result
}
