// Código Pix estático (BR Code, padrão EMV do Banco Central) sem valor fixo:
// quem contribui escolhe o valor no app do banco. A chave é aleatória de
// propósito, porque o site e o repositório são públicos.
export const PIX_KEY = "726c4fe3-0533-495f-9fb4-7c00a8dfe7b7";
export const PIX_NAME = "Joao Vitor Pedrosa Faria";
export const PIX_CITY = "BRASIL";

function field(id: string, value: string) {
  return id + String(value.length).padStart(2, "0") + value;
}

// CRC16-CCITT (polinômio 0x1021, início 0xFFFF), como pede o manual do BR Code.
export function crc16(text: string) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Os campos de nome e cidade aceitam só ASCII, até 25 e 15 caracteres.
function plain(text: string, max: number) {
  return text
    .normalize("NFD")
    .replace(/[^\x20-\x7e]/g, "")
    .slice(0, max);
}

export function pixPayload(key = PIX_KEY, name = PIX_NAME, city = PIX_CITY) {
  const body =
    field("00", "01") +
    field("26", field("00", "br.gov.bcb.pix") + field("01", key)) +
    field("52", "0000") +
    field("53", "986") +
    field("58", "BR") +
    field("59", plain(name, 25)) +
    field("60", plain(city, 15)) +
    field("62", field("05", "***")) +
    "6304";
  return body + crc16(body);
}
