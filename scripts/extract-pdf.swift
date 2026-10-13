import Foundation
import PDFKit
let input=CommandLine.arguments[1]
guard let doc=PDFDocument(url:URL(fileURLWithPath:input)) else {fatalError("PDF inválido")}
var pages:[[String:Any]]=[]
for i in 0..<doc.pageCount {pages.append(["number":i+1,"text":doc.page(at:i)?.string ?? ""])}
let data=try JSONSerialization.data(withJSONObject:pages,options:[.prettyPrinted,.sortedKeys])
FileHandle.standardOutput.write(data)
