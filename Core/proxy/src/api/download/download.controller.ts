import { Controller, Get, Query, Param, Req, Res, HttpException, HttpStatus,} from '@nestjs/common';
import { Request, Response } from 'express';
import { DownloadService } from './download.service';

@Controller()
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get('download')
  async download(
    @Query('url') url: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.downloadService.streamFile(url, req, res);
  }

  @Get('dl/:token/:name')
  async dl(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let fileUrl: string;
    try {
      fileUrl = Buffer.from(token, 'base64url').toString('utf8');
    } catch {
      throw new HttpException('Bad token', HttpStatus.BAD_REQUEST);
    }
    return this.downloadService.streamFile(fileUrl, req, res);
  }
}