import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Request, Response } from 'express';

@Injectable()
export class DownloadService {
  async streamFile(fileUrl: string, req: Request, res: Response) {
    try {
      const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream',
        headers: req.headers.range ? { Range: req.headers.range } : undefined,
      });

      res.status(response.status);
      const contentType = response.headers['content-type'];
      if (typeof contentType === 'string') {
        res.setHeader('Content-Type', contentType);
      } else {
        res.setHeader('Content-Type', 'application/octet-stream');
      }

      const contentLength = response.headers['content-length'];
      if (contentLength) {
        res.setHeader('Content-Length', String(contentLength));
      }

      const contentRange = response.headers['content-range'];
      if (typeof contentRange === 'string') {
        res.setHeader('Content-Range', contentRange);
      }

      const acceptRanges = response.headers['accept-ranges'];
      res.setHeader('Accept-Ranges', typeof acceptRanges === 'string' ? acceptRanges : 'bytes');

      const contentDisposition = response.headers['content-disposition'];
      res.setHeader(
        'Content-Disposition',
        typeof contentDisposition === 'string'
          ? contentDisposition
          : `attachment; filename="${getPackageFilename(fileUrl)}"`,
      );

      response.data.pipe(res);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch or stream the remote file',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

function getPackageFilename(fileUrl: string): string {
  try {
    const pathname = new URL(fileUrl).pathname;
    const filename = decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1));
    if (filename.toLowerCase().endsWith('.pkg')) {
      return filename.replace(/[\\"\r\n]/g, '_');
    }
  } catch {
    // Use a stable package filename when the source URL cannot be parsed.
  }

  return 'package.pkg';
}