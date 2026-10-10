import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class DownloadService {
    async streamFile(fileUrl: string, res: Response){
        try{
            const response = await axios({
                method: 'GET',
                url: fileUrl,
                responseType: "stream",
            });
            res.setHeader('Content-Type', response.headers['Content-Type'] || 'application/octet-stream');            
        }
        catch (e){

        }
    }
}
