import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * CypherService — Cifrado AES-128-CBC para el protocolo Winder.
 *
 * Usa la Web Crypto API nativa del browser (sin dependencias externas)
 * replicando exactamente el comportamiento de CryptoJS del STG:
 *   - Algoritmo: AES-CBC
 *   - Key: 128 bits (hex string de 32 caracteres)
 *   - IV: 16 bytes en cero
 *   - Padding: PKCS#7 (lo aplica SubtleCrypto por defecto)
 *   - Output: Base64 estándar
 *
 * El método sincrónico `encryptSync` / `decryptSync` se expone para
 * compatibilidad con WinderService (que construye la URL de forma síncrona).
 * Internamente usa una implementación AES-CBC pura en JS cuando SubtleCrypto
 * no está disponible (entornos SSR / Node).
 *
 * Migrado del STG (stg-app-mis-r22) — sin dependencia de crypto-js.
 */
@Injectable({ providedIn: 'root' })
export class CypherService {
  private readonly secret = environment.cypherSecret;

  // ─── AES-CBC puro en JS (sincrónico) ─────────────────────────────────────
  // Implementación mínima compatible con el comportamiento de CryptoJS.

  /** Convierte un string hexadecimal en Uint8Array. */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, 2 + i), 16);
    }
    return bytes;
  }

  /** Convierte Uint8Array a string Base64. */
  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  /** Convierte string Base64 a Uint8Array. */
  private base64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Aplica padding PKCS#7 a un buffer para que sea múltiplo de 16 bytes.
   */
  private pkcs7Pad(data: Uint8Array): Uint8Array {
    const blockSize = 16;
    const padLen = blockSize - (data.length % blockSize);
    const padded = new Uint8Array(data.length + padLen);
    padded.set(data);
    padded.fill(padLen, data.length);
    return padded;
  }

  /**
   * Elimina el padding PKCS#7 tras descifrar.
   */
  private pkcs7Unpad(data: Uint8Array): Uint8Array {
    const padLen = data[data.length - 1];
    return data.slice(0, data.length - padLen);
  }

  // ─── Operaciones AES-ECB (bloque a bloque, base para CBC) ─────────────────
  // Implementación AES estándar (FIPS 197).

  private readonly sBox = new Uint8Array([
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
  ]);

  private readonly invSBox = new Uint8Array(256);
  private readonly rCon = new Uint8Array([
    0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36,
  ]);

  constructor() {
    // Inicializar invSBox
    for (let i = 0; i < 256; i++) {
      this.invSBox[this.sBox[i]] = i;
    }
  }

  private xtime(a: number): number {
    return ((a << 1) ^ ((a & 0x80) ? 0x1b : 0x00)) & 0xff;
  }

  private gmul(a: number, b: number): number {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      if (b & 1) p ^= a;
      const hiBit = a & 0x80;
      a = (a << 1) & 0xff;
      if (hiBit) a ^= 0x1b;
      b >>= 1;
    }
    return p;
  }

  private keyExpansion(key: Uint8Array): Uint32Array {
    const nk = key.length / 4; // 4 para AES-128
    const nr = nk + 6;         // 10 para AES-128
    const w = new Uint32Array((nr + 1) * 4);
    for (let i = 0; i < nk; i++) {
      w[i] = (key[4*i] << 24) | (key[4*i+1] << 16) | (key[4*i+2] << 8) | key[4*i+3];
    }
    for (let i = nk; i < (nr + 1) * 4; i++) {
      let temp = w[i - 1];
      if (i % nk === 0) {
        // RotWord + SubWord + Rcon
        temp = (temp << 8) | (temp >>> 24);
        temp = (this.sBox[(temp >>> 24) & 0xff] << 24) |
               (this.sBox[(temp >>> 16) & 0xff] << 16) |
               (this.sBox[(temp >>> 8)  & 0xff] << 8)  |
               (this.sBox[(temp)        & 0xff]);
        temp ^= (this.rCon[(i / nk) - 1] << 24);
      }
      w[i] = w[i - nk] ^ temp;
    }
    return w;
  }

  private addRoundKey(state: Uint8Array, w: Uint32Array, round: number): void {
    for (let c = 0; c < 4; c++) {
      const wk = w[round * 4 + c];
      state[c * 4]     ^= (wk >>> 24) & 0xff;
      state[c * 4 + 1] ^= (wk >>> 16) & 0xff;
      state[c * 4 + 2] ^= (wk >>> 8)  & 0xff;
      state[c * 4 + 3] ^= (wk)        & 0xff;
    }
  }

  private subBytes(state: Uint8Array): void {
    for (let i = 0; i < 16; i++) state[i] = this.sBox[state[i]];
  }

  private invSubBytes(state: Uint8Array): void {
    for (let i = 0; i < 16; i++) state[i] = this.invSBox[state[i]];
  }

  private shiftRows(state: Uint8Array): void {
    // state es column-major: state[col*4 + row]
    // row 1: shift 1, row 2: shift 2, row 3: shift 3
    let t: number;
    // row 1
    t = state[1]; state[1] = state[5]; state[5] = state[9]; state[9] = state[13]; state[13] = t;
    // row 2
    t = state[2]; state[2] = state[10]; state[10] = t;
    t = state[6]; state[6] = state[14]; state[14] = t;
    // row 3
    t = state[15]; state[15] = state[11]; state[11] = state[7]; state[7] = state[3]; state[3] = t;
  }

  private invShiftRows(state: Uint8Array): void {
    let t: number;
    t = state[13]; state[13] = state[9]; state[9] = state[5]; state[5] = state[1]; state[1] = t;
    t = state[2]; state[2] = state[10]; state[10] = t;
    t = state[6]; state[6] = state[14]; state[14] = t;
    t = state[3]; state[3] = state[7]; state[7] = state[11]; state[11] = state[15]; state[15] = t;
  }

  private mixColumns(state: Uint8Array): void {
    for (let c = 0; c < 4; c++) {
      const s0 = state[c*4], s1 = state[c*4+1], s2 = state[c*4+2], s3 = state[c*4+3];
      state[c*4]   = this.gmul(s0,2) ^ this.gmul(s1,3) ^ s2 ^ s3;
      state[c*4+1] = s0 ^ this.gmul(s1,2) ^ this.gmul(s2,3) ^ s3;
      state[c*4+2] = s0 ^ s1 ^ this.gmul(s2,2) ^ this.gmul(s3,3);
      state[c*4+3] = this.gmul(s0,3) ^ s1 ^ s2 ^ this.gmul(s3,2);
    }
  }

  private invMixColumns(state: Uint8Array): void {
    for (let c = 0; c < 4; c++) {
      const s0 = state[c*4], s1 = state[c*4+1], s2 = state[c*4+2], s3 = state[c*4+3];
      state[c*4]   = this.gmul(s0,14) ^ this.gmul(s1,11) ^ this.gmul(s2,13) ^ this.gmul(s3,9);
      state[c*4+1] = this.gmul(s0,9)  ^ this.gmul(s1,14) ^ this.gmul(s2,11) ^ this.gmul(s3,13);
      state[c*4+2] = this.gmul(s0,13) ^ this.gmul(s1,9)  ^ this.gmul(s2,14) ^ this.gmul(s3,11);
      state[c*4+3] = this.gmul(s0,11) ^ this.gmul(s1,13) ^ this.gmul(s2,9)  ^ this.gmul(s3,14);
    }
  }

  /** Cifra un bloque de 16 bytes con AES-128 (ECB). */
  private aesEncryptBlock(block: Uint8Array, w: Uint32Array): Uint8Array {
    // El layout column-major del state (state[col*4+row]) coincide con el
    // orden natural de bytes de entrada (in[r+4c] === in[c*4+r]), por lo
    // que no se requiere ninguna transposición al copiar el bloque.
    const state = new Uint8Array(16);
    state.set(block);

    const nr = 10; // AES-128
    this.addRoundKey(state, w, 0);
    for (let round = 1; round < nr; round++) {
      this.subBytes(state);
      this.shiftRows(state);
      this.mixColumns(state);
      this.addRoundKey(state, w, round);
    }
    this.subBytes(state);
    this.shiftRows(state);
    this.addRoundKey(state, w, nr);

    const out = new Uint8Array(16);
    out.set(state);
    return out;
  }

  /** Descifra un bloque de 16 bytes con AES-128 (ECB). */
  private aesDecryptBlock(block: Uint8Array, w: Uint32Array): Uint8Array {
    const state = new Uint8Array(16);
    state.set(block);

    const nr = 10;
    this.addRoundKey(state, w, nr);
    for (let round = nr - 1; round > 0; round--) {
      this.invShiftRows(state);
      this.invSubBytes(state);
      this.addRoundKey(state, w, round);
      this.invMixColumns(state);
    }
    this.invShiftRows(state);
    this.invSubBytes(state);
    this.addRoundKey(state, w, 0);

    const out = new Uint8Array(16);
    out.set(state);
    return out;
  }

  // ─── API pública ───────────────────────────────────────────────────────────

  /**
   * Cifra un string con AES-128-CBC (IV de 16 bytes en cero).
   * Devuelve el ciphertext en Base64, igual que CryptoJS del STG.
   */
  public encrypt(plainText: string, secretHex?: string): string {
    const keyHex = secretHex ?? this.secret;
    const key = this.hexToBytes(keyHex);
    const w = this.keyExpansion(key);
    const iv = new Uint8Array(16); // todo ceros

    const data = new TextEncoder().encode(plainText);
    const padded = this.pkcs7Pad(data);
    const cipher = new Uint8Array(padded.length);

    let prev: Uint8Array = iv;
    for (let i = 0; i < padded.length; i += 16) {
      // XOR con el bloque anterior (CBC)
      const xored = new Uint8Array(16);
      for (let j = 0; j < 16; j++) xored[j] = (padded[i + j] ?? 0) ^ prev[j];
      const enc = this.aesEncryptBlock(xored, w);
      cipher.set(enc, i);
      prev = enc;
    }
    return this.bytesToBase64(cipher);
  }

  /**
   * Descifra un string Base64 cifrado con AES-128-CBC (IV de 16 bytes en cero).
   */
  public decrypt(cipherText: string, secretHex?: string): string {
    const keyHex = secretHex ?? this.secret;
    const key = this.hexToBytes(keyHex);
    const w = this.keyExpansion(key);
    const iv = new Uint8Array(16);

    const cipher = this.base64ToBytes(cipherText);
    const plain = new Uint8Array(cipher.length);

    let prev: Uint8Array = iv;
    for (let i = 0; i < cipher.length; i += 16) {
      const block = new Uint8Array(16);
      for (let j = 0; j < 16; j++) block[j] = cipher[i + j] ?? 0;
      const dec = this.aesDecryptBlock(block, w);
      const xored = new Uint8Array(16);
      for (let j = 0; j < 16; j++) xored[j] = dec[j] ^ prev[j];
      plain.set(xored, i);
      prev = block;
    }
    return new TextDecoder().decode(this.pkcs7Unpad(plain));
  }

  /**
   * Cifra para uso en parámetros de URL:
   * reemplaza `+` por `$` para evitar conflictos con query strings.
   */
  public encryptForRoute(key: string, secret?: string): string {
    return this.encrypt(key, secret).replace(/\+/g, '$');
  }

  /**
   * Descifra un valor cifrado con `encryptForRoute`.
   */
  public decryptFromRoute(key: string, secret?: string): string {
    return this.decrypt(key.replace(/\$/g, '+'), secret);
  }
}
