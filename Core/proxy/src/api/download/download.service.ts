import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Request, Response } from 'express';

const ALLOWED = ['archive.org'];

@Injectable()
export class DownloadService {
  async streamFile(fileUrl: string, req: Request, res: Response) {
    let target: URL;
    try { target = new URL(fileUrl); } catch {
      throw new HttpException('Invalid URL', HttpStatus.BAD_REQUEST);
    }
    if (!ALLOWED.some(h => target.hostname === h || target.hostname.endsWith('.' + h))) {
      throw new HttpException('Host not allowed', HttpStatus.FORBIDDEN);
    }

    console.log(req.method, req.originalUrl, 'range=', req.headers.range);

    const baseHeaders = { 'Accept-Encoding': 'identity' };

    // HEAD: never download the body. Probe 1 byte and read the total size.
    if (req.method === 'HEAD') {
      try {
        const probe = await axios({
          method: 'GET',
          url: target.toString(),
          responseType: 'stream',
          decompress: false,
          timeout: 30000,
          validateStatus: () => true,
          headers: { ...baseHeaders, Range: 'bytes=0-0' },
        });
        probe.data.destroy();

        const cr = probe.headers['content-range'];
        const total = typeof cr === 'string' ? cr.split('/')[1] : probe.headers['content-length'];

        res.status(probe.status === 206 || probe.status === 200 ? 200 : probe.status);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Accept-Ranges', 'bytes');
        if (total) res.setHeader('Content-Length', String(total));
        return res.end();
      } catch (e) {
        console.error('HEAD probe failed', (e as Error).message);
        throw new HttpException('Upstream unreachable', HttpStatus.BAD_GATEWAY);
      }
    }

    let upstream;
    try {
      upstream = await axios({
        method: 'GET',
        url: target.toString(),
        responseType: 'stream',
        decompress: false,
        timeout: 30000,
        validateStatus: () => true,
        headers: { ...baseHeaders, ...(req.headers.range ? { Range: req.headers.range } : {}) },
      });
    } catch (e) {
      console.error('upstream error', (e as Error).message);
      throw new HttpException('Upstream unreachable', HttpStatus.BAD_GATEWAY);
    }

    res.status(upstream.status);
    const h = upstream.headers;
    res.setHeader('Content-Type', h['content-type'] ?? 'application/octet-stream');
    if (h['content-length']) res.setHeader('Content-Length', String(h['content-length']));
    if (h['content-range']) res.setHeader('Content-Range', String(h['content-range']));
    res.setHeader('Accept-Ranges', 'bytes');

    res.on('close', () => upstream.data.destroy());   // client gone -> stop pulling
    upstream.data.on('error', () => res.destroy());
    upstream.data.pipe(res);
  }
}