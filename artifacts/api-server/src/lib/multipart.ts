import type { Request } from "express";

export type UploadedPart = {
  fieldName: string;
  filename: string;
  contentType: string;
  data: Buffer;
};

export type MultipartForm = {
  fields: Record<string, string>;
  file?: UploadedPart;
};

export function parseMultipartForm(request: Request): MultipartForm {
  const contentType = request.headers["content-type"] ?? "";
  const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/i);
  if (!boundaryMatch) {
    throw new Error("Multipart boundary is missing.");
  }

  if (!Buffer.isBuffer(request.body)) {
    throw new Error("Multipart request body is missing.");
  }

  const body = request.body as Buffer;
  const delimiter = Buffer.from(`--${boundaryMatch[1]}`);
  const headerDelimiter = Buffer.from("\r\n\r\n");
  const fields: Record<string, string> = {};
  let file: UploadedPart | undefined;
  let cursor = body.indexOf(delimiter);

  while (cursor !== -1) {
    cursor += delimiter.length;
    if (body.subarray(cursor, cursor + 2).toString() === "--") break;
    if (body.subarray(cursor, cursor + 2).toString() === "\r\n") cursor += 2;

    const headersEnd = body.indexOf(headerDelimiter, cursor);
    if (headersEnd === -1) throw new Error("Multipart part headers are malformed.");
    const headers = body.subarray(cursor, headersEnd).toString("utf8");
    const nextBoundary = body.indexOf(delimiter, headersEnd + headerDelimiter.length);
    if (nextBoundary === -1) throw new Error("Multipart closing boundary is missing.");

    const dataStart = headersEnd + headerDelimiter.length;
    const dataEnd =
      body.subarray(nextBoundary - 2, nextBoundary).toString() === "\r\n"
        ? nextBoundary - 2
        : nextBoundary;
    const disposition = headers.match(/content-disposition:.*?name="([^"]+)"(?:.*?filename="([^"]*)")?/is);
    if (!disposition) throw new Error("Multipart content disposition is missing.");

    const fieldName = disposition[1];
    const filename = disposition[2];
    const contentTypeHeader = headers.match(/content-type:\s*([^\r\n]+)/i);
    const partData = body.subarray(dataStart, dataEnd);

    if (filename !== undefined) {
      file = {
        fieldName,
        filename,
        contentType: contentTypeHeader?.[1]?.trim() ?? "application/octet-stream",
        data: partData,
      };
    } else {
      fields[fieldName] = partData.toString("utf8");
    }

    cursor = nextBoundary;
  }

  return { fields, file };
}