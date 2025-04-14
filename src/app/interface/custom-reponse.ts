import { HttpResponse } from "@angular/common/http";
import { Server } from "./server";

export interface CustomResponse {
    timeStamp: Date;
    statusCode: Number;
    status: String;
    reason: String;
    message: String;
    developerMessage: String;
    data: { servers?: Server[], server?: Server };
}