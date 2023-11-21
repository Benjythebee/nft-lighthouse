export default {
    byteaBufferToString: function (buffer: Buffer): string {
      return '0x' + buffer.toString('hex')
    },
    stringToByteaBuffer: function (hexString: string): Buffer {
      if (hexString.startsWith('0x')) {
        hexString = hexString.substr(2)
      }
      const bytes = new Uint8Array(Math.ceil(hexString.length / 2))
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hexString.substr(i * 2, 2), 16)
      }
      return Buffer.from(bytes)
    },
  }
  