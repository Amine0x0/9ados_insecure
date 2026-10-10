import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class DownloadService {
  async streamFile(fileUrl: string, res: Response) {
    try {
      const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream',
      });

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

      response.data.pipe(res);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch or stream the remote file',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}