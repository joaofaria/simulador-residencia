// Leitor mínimo de protobuf para os campos que o Anki novo guarda em blob
// (configuração de modelos, de baralhos e a lista de mídia). Só entende os
// tipos de que precisamos; o resto é pulado.
export type ProtoValue = number | Uint8Array;
export type ProtoMessage = Map<number, ProtoValue[]>;

export function decodeProto(bytes: Uint8Array): ProtoMessage {
  const out: ProtoMessage = new Map();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 0;
  function varint() {
    let result = 0;
    let shift = 0;
    for (;;) {
      if (pos >= bytes.length) throw Error("Protobuf truncado");
      const b = bytes[pos++];
      result += (b & 0x7f) * 2 ** shift;
      if (b < 0x80) return result;
      shift += 7;
    }
  }
  while (pos < bytes.length) {
    const tag = varint();
    const field = Math.floor(tag / 8);
    const wire = tag % 8;
    let value: ProtoValue;
    if (wire === 0) value = varint();
    else if (wire === 1) {
      value = view.getFloat64(pos, true);
      pos += 8;
    } else if (wire === 2) {
      const len = varint();
      value = bytes.subarray(pos, pos + len);
      pos += len;
    } else if (wire === 5) {
      value = view.getFloat32(pos, true);
      pos += 4;
    } else throw Error(`Tipo de campo protobuf não suportado: ${wire}`);
    const list = out.get(field);
    if (list) list.push(value);
    else out.set(field, [value]);
  }
  return out;
}

const utf8 = new TextDecoder();

export function protoString(m: ProtoMessage, field: number) {
  const v = m.get(field)?.[0];
  return v instanceof Uint8Array ? utf8.decode(v) : "";
}

export function protoNumber(m: ProtoMessage, field: number) {
  const v = m.get(field)?.at(-1);
  return typeof v === "number" ? v : undefined;
}

// Lista de floats "packed" (passos de aprendizado, em minutos).
export function protoFloats(m: ProtoMessage, field: number) {
  const out: number[] = [];
  for (const v of m.get(field) ?? []) {
    if (typeof v === "number") out.push(v);
    else {
      const view = new DataView(v.buffer, v.byteOffset, v.byteLength);
      for (let i = 0; i + 4 <= v.byteLength; i += 4)
        out.push(view.getFloat32(i, true));
    }
  }
  return out;
}
