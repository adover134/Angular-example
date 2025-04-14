import { Component, OnInit } from '@angular/core';
import { ServerService } from './service/server.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { CustomResponse } from './interface/custom-reponse';
import { AppState } from './interface/app-state';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { NgForm } from '@angular/forms';
import { Server } from './interface/server';
import { SnackbarStackService } from './services/snackbar-stack.service';

import ExcelJS from 'exceljs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  // REST API 결과물이다.
  appState$ = new Observable<AppState<CustomResponse>>;
  // 사용할 enum들을 정의해놨다.
  // readonly라는 것은 당연히 값을 바꿀 수 없다는 뜻이다.
  // enum은 비교 용도이지 값을 수정하는 등의 용도를 갖지는 않는다.
  readonly DataState = DataState;
  readonly Status = Status;
  // 일종의 행동 객체이므로 observable 처리가 가능하다.
  private filterSubject = new BehaviorSubject<string> ('');
  private dataSubject = new BehaviorSubject<CustomResponse | null> (null);
  filterStatus$ = this.filterSubject.asObservable();
  // 일종의 행동 객체이므로 observable 처리가 가능하다.
  private isLoading = new BehaviorSubject<boolean> (false);
  isLoading$ = this.isLoading.asObservable();


  constructor(private serverService: ServerService, private snackbarStack: SnackbarStackService) { }
  
  ngOnInit(): void {
    this.appState$ = this.serverService.servers$()
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED_STATE, appData: { ...response, data: {servers: response.data?.servers?.reverse()} } }
        }),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: String) => {
          this.filterSubject.next('');
          return of({ dataState: DataState.ERROR_STATE, error: error })
        })
      );
  }

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(response => {
          var index = null;
          if (this.dataSubject.value && this.dataSubject.value.data.servers)
            if (response.data.server)
            {
              const Server = response.data.server;
              index = this.dataSubject.value.data.servers.findIndex(server => server.id === Server.id);
            }
          if (this.dataSubject.value && this.dataSubject.value.data.servers && index !== null)
            if (response.data.server)
              {
                const Server = response.data.server;
                this.dataSubject.value.data.servers[index] = response.data.server;
              }
          this.filterSubject.next('ipAddress');
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value ?? undefined }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value ?? undefined }),
        catchError((error: String) => {
          return of({ dataState: DataState.ERROR_STATE, error: error })
        })
      );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(<Server>serverForm.value)
      .pipe(
        map(response => {
          if (this.dataSubject.value && this.dataSubject.value.data && this.dataSubject.value.data.servers && response.data && response.data.server)
            this.dataSubject.next(
              {...response, data: { servers: [response.data.server, ...this.dataSubject.value.data.servers] } }
            );
            let closeModal = document.getElementById('closeModal');
            if (closeModal !== null)
              closeModal.click();
            this.isLoading.next(false);
            serverForm.resetForm({status: this.Status.SERVER_DOWN});
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value ?? undefined }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value ?? undefined }),
        catchError((error: String) => {
          return of({ dataState: DataState.ERROR_STATE, error: error })
        })
      );
  }

  filterServers(status: Status): void {
    if (this.dataSubject.value)
      this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          console.log('filter log 체크!')
          return { dataState: DataState.LOADED_STATE, appData: response ?? undefined }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value ?? undefined }),
        catchError((error: String) => {
          this.filterSubject.next('');
          return of({ dataState: DataState.ERROR_STATE, error: error })
        })
      );
  }

  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id)
      .pipe(
        map(response => {
          this.dataSubject.next(
            { ...response, data: {servers: this.dataSubject.value?.data?.servers?.filter(s => s.id !== server.id)} }
          );
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value ?? undefined }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value ?? undefined }),
        catchError((error: String) => {
          return of({ dataState: DataState.ERROR_STATE, error: error })
        })
      );
  }

  async printReport() {
    // window.print(); 웹 페이지 출력을 시킨다.
    // 테이블을 저장할 워크북 (엑셀 파일)을 만든다.
    const workbook = new ExcelJS.Workbook();
    // 엑셀 시트를 추가한다.
    const worksheet = workbook.addWorksheet('서버 리스트');

    // 테이블을 불러온다.
    const table = document.getElementById('servers') as HTMLTableElement;
    // 테이블의 모든 값을 저장한다.
    const rows = table.rows;

    // 헤더 행을 구한다.
    const headerRow = rows[0];
    const headerValues: string[] = [];
    // 열 번호를 구한다.
    const includedColumnIndexes: number[] = [];

    // 헤더 행의 각 값마다 (각 열마다)
    for (let j = 0; j < headerRow.cells.length; j++) {
      const headerText = headerRow.cells[j].textContent?.trim() || '';
      // 만약 특정 값이라면 엑셀 파일에 넣지 않는다.
      if (headerText !== 'Ping' && headerText !== 'Actions') {
        headerValues.push(headerText);
        includedColumnIndexes.push(j);
      }
    }
    // 헤더 행을 엑셀 파일에 넣는다.
    worksheet.addRow(headerValues);

    // 본문 행의 값을 넣는 부분
    for (let i = 1; i < rows.length; i++) {
      // 엑셀에 행을 추가한다.
      const row = rows[i];
      const excelRow = worksheet.addRow([]);

      for (let k = 0; k < includedColumnIndexes.length; k++) {
        // 헤더 행에서 엑셀에 넣기로 한 열의 값들만 구한다.
        const j = includedColumnIndexes[k];
        const cell = row.cells[j];

        // 만약 해당 값이 이미지라면
        const imgElement = cell.querySelector('img');
        if (imgElement && imgElement.src) {
          // 그 이미지를 다운받은 후
          const response = await fetch(imgElement.src);
          // 이진 파일로 변환하고
          const blob = await response.blob();
          // 버퍼에 넣은 뒤에 (이미지로 재변환)
          const buffer = await blob.arrayBuffer();
          // 원래 확장자로 복원한다. (기본적으로는 하드코딩)
          const imageId = workbook.addImage({
            buffer,
            extension: 'png',
          });
          // 이미지를 엑셀 파일에 추가한다.
          worksheet.addImage(imageId, {
            tl: { col: k, row: i },
            ext: { width: 20, height: 20 },
          });
          // 각 셀의 크기를 지정한다.
          worksheet.getRow(i + 1).height = 30;
        }
        // 이미지가 아니라면 내부 텍스트를 그냥 넣는다.
        else {
          const text = cell.textContent?.trim() || '';
          excelRow.getCell(k + 1).value = text;
        }
      }
    }
    
    // 완성된 워크북을 엑셀로 변환하기 위해 이진 파일로 변환한다.
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // 이진 파일 다운로드 링크를 실행하는 하이퍼링크를 만든다.
    const downloadLink = document.createElement("a");
    // 다운로드 이진 파일의 다운로드 링크를 생성한다.
    const blobUrl = URL.createObjectURL(blob);
    downloadLink.href = blobUrl;
    // 파일명을 지정하여 다운로드한다.
    downloadLink.download = "server-report.xlsx";
    // 하이퍼링크를 제거한다.
    downloadLink.click();

    // 생성된 URL은 자동 삭제가 안 되니 삭제해준다.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100); 
  }

  showAlert(): void {
    const message = `테스트 알림 - ${new Date().toLocaleTimeString()}\n`;
    this.snackbarStack.open(message+'이건 테스트 알림입니다!');
  }

}
