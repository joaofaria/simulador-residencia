import Foundation
import PDFKit
import AppKit

// Recortes do PDF são a referência visual; texto extraído permanece auxiliar.
let input = CommandLine.arguments[1]
let output = CommandLine.arguments[2]
let examID = CommandLine.arguments[3]
guard let document = PDFDocument(url: URL(fileURLWithPath: input)) else { fatalError("PDF inválido") }
try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
struct Marker { let number: Int; let page: Int; let range: NSRange; let rect: CGRect }
var markers: [Marker] = []
var texts: [String] = []
var answerStart = document.pageCount
let markerRegex = try NSRegularExpression(pattern: "(?m)^QUESTÃO\\s+(\\d+)\\.")
for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { fatalError("Página ausente") }
    let text = page.string ?? ""
    texts.append(text)
    if text.hasPrefix("RESPOSTAS") || text.range(of: "Medway[^\\n]*GABARITO", options: .regularExpression) != nil { answerStart = min(answerStart, index) }
    for match in markerRegex.matches(in: text, range: NSRange(text.startIndex..., in: text)) {
        let value = (text as NSString).substring(with: match.range(at: 1))
        guard let number = Int(value), let selection = page.selection(for: match.range) else { fatalError("Marcador inválido") }
        markers.append(Marker(number: number, page: index, range: match.range, rect: selection.bounds(for: page)))
    }
}
var questions: [[String: Any]] = []
let scale: CGFloat = 2
for (index, marker) in markers.enumerated() {
    let next = index + 1 < markers.count ? markers[index + 1] : nil
    let lastPage = min(next?.page ?? (answerStart - 1), answerStart - 1)
    var assets: [[String: Any]] = []
    for pageIndex in marker.page...lastPage {
        guard let page = document.page(at: pageIndex) else { fatalError("Página ausente") }
        let pageText = texts[pageIndex] as NSString
        let textStart = pageIndex == marker.page ? marker.range.location : 0
        let textEnd = next?.page == pageIndex ? next!.range.location : pageText.length
        let segment = pageText.substring(with: NSRange(location: textStart, length: max(0, textEnd - textStart)))
            .replacingOccurrences(of: "(?m)^Medway[^\\n]*$", with: "", options: .regularExpression)
            .replacingOccurrences(of: "(?m)^.*Objetiva.*\\| R1\\s*$", with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if segment.isEmpty { continue }
        let media = page.bounds(for: .mediaBox)
        var bottom = media.minY + 26
        let footerRegex = try NSRegularExpression(pattern: "(?m)^Medway[^\\n]*$")
        if let footer = footerRegex.firstMatch(in: texts[pageIndex], range: NSRange(location: 0, length: pageText.length)), let selection = page.selection(for: footer.range) {
            bottom = max(bottom, selection.bounds(for: page).maxY + 8)
        }
        let top = pageIndex == marker.page ? min(media.maxY, marker.rect.maxY + 12) : media.maxY - 24
        if let next = next, next.page == pageIndex { bottom = max(bottom, next.rect.maxY + 5) }
        guard top > bottom else { fatalError("Recorte inválido na questão \(marker.number)") }
        let crop = CGRect(x: media.minX, y: bottom, width: media.width, height: top - bottom)
        let width = Int(ceil(crop.width * scale)), height = Int(ceil(crop.height * scale))
        guard let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0), let context = NSGraphicsContext(bitmapImageRep: bitmap)?.cgContext else { fatalError("Falha ao criar imagem") }
        context.setFillColor(NSColor.white.cgColor)
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        context.scaleBy(x: scale, y: scale)
        context.translateBy(x: -crop.minX, y: -crop.minY)
        page.draw(with: .mediaBox, to: context)
        let filename = String(format: "q%03d-p%02d.png", marker.number, pageIndex + 1)
        guard let data = bitmap.representation(using: .png, properties: [:]) else { fatalError("Falha ao salvar imagem") }
        try data.write(to: URL(fileURLWithPath: output).appendingPathComponent(filename))
        assets.append(["src": "provas/assets/\(examID)/\(filename)", "alt": "Questão \(marker.number), trecho original da página \(pageIndex + 1), incluindo imagens, tabelas e alternativas.", "page": pageIndex + 1])
    }
    questions.append(["number": marker.number, "assets": assets])
}
// Associa número e resposta pela posição visual da célula, sem presumir ordem do texto.
var keys: [[String: Any]] = []
let numberRegex = try NSRegularExpression(pattern: "(?m)(?<!\\S)(\\d{1,3})\\.")
let answerRegex = try NSRegularExpression(pattern: "\\b(?:ANULADA|[A-E])\\b")
for pageIndex in 0..<document.pageCount where texts[pageIndex].hasPrefix("RESPOSTAS") {
    guard let page = document.page(at: pageIndex) else { fatalError("Página ausente") }
    let text = texts[pageIndex], range = NSRange(text.startIndex..., in: text)
    let answers = answerRegex.matches(in: text, range: range).compactMap { match -> (String, CGRect)? in
        guard let selection = page.selection(for: match.range) else { return nil }
        return ((text as NSString).substring(with: match.range), selection.bounds(for: page))
    }
    for match in numberRegex.matches(in: text, range: range) {
        guard let number = Int((text as NSString).substring(with: match.range(at: 1))), let selection = page.selection(for: match.range) else { fatalError("Número inválido") }
        let rect = selection.bounds(for: page)
        let candidates = answers.filter { abs($0.1.midY - rect.midY) < 6 && $0.1.minX > rect.minX && $0.1.minX - rect.maxX < 80 }
            .sorted { $0.1.minX < $1.1.minX }
        guard let answer = candidates.first else { fatalError("Gabarito não identificado na questão \(number)") }
        keys.append(["number": number, "answer": answer.0, "page": pageIndex + 1])
    }
}
let result: [String: Any] = ["exam": examID, "questions": questions, "keys": keys]
let data = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
try data.write(to: URL(fileURLWithPath: "imports/\(examID).rendered.json"))
print("\(examID): \(questions.count) questões renderizadas, \(keys.count) respostas identificadas por posição no PDF.")
