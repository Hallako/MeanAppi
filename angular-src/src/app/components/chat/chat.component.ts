import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import * as io from "socket.io-client";


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit, AfterViewChecked {

  @ViewChild('scrollMe') private myScrollContainer: ElementRef;

  Admin: boolean;
  Hidden: boolean;
  chats: any;
  joinned: boolean = false;
  newUser = { nickname: '', room: '' };
  msgData = { room: '', nickname: '', message: '' };
  socket = io('http://localhost:8081/');

  constructor(private chatService: ChatService,
    private authservice: AuthService) { }

  ngOnInit() {

    this.Admin = this.authservice.getAdmin();
    console.log(this.Admin)

    this.newUser.nickname = 'Asiakaspalvelu ' + JSON.parse(localStorage.getItem("user")).name;
    var user = JSON.parse(localStorage.getItem("userr"));

    if (user !== null) {
      if (user.room) {
        this.getChatByRoom(user.room);
        this.msgData = { room: user.room, nickname: user.nickname, message: '' }
        this.joinned = true;
        this.scrollToBottom();
      }
    }

    //###### SOCKETS ########
    this.socket.on('new-message', function(data) {
      if (data.message.room === JSON.parse(localStorage.getItem("userr")).room) {
        this.chats.push(data.message);

        this.msgData = { room: this.newUser.room, nickname: user.nickname, message: '' }
        this.scrollToBottom();

      }
    }.bind(this));

    this.socket.on('userconn-response', function(data) {
      this.newUser.room = data.socketconnection;
      this.msgData.room = data.socketconnection;

      localStorage.setItem("userr", JSON.stringify(this.newUser));
      this.getChatByRoom(this.newUser.room);
      console.log(data.socketconnection)
    }.bind(this));

    //Ngoninit END
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  getChatByRoom(room) {
    this.chatService.getChatByRoom(room).then((res) => {
      this.chats = res;
    }, (err) => {
      console.log(err);
    });
  }

  createRoom() {
    var date = new Date();
    this.msgData = { room: this.newUser.room, nickname: this.newUser.nickname, message: '' };
    this.socket.emit('createroom', { room: this.newUser.room, nickname: this.newUser.nickname, message: 'Join this room', updated_at: date });
    this.joinned = true;
  }

  sendMessage() {
    this.chatService.saveChat(this.msgData).then((result) => {
      this.socket.emit('save-message', result);
      this.msgData.message = '';
    }, (err) => {
      console.log(err);
    });
  }

  logout() {
    var date = new Date();
    var user = JSON.parse(localStorage.getItem("userr"));

    this.socket.emit('adminleaveroom', { room: user.room, nickname: user.nickname, message: 'Left this room', updated_at: date });
    localStorage.removeItem("userr");
    this.newUser.room = "";
    this.joinned = false;
  }

  togglehide() {
    if (this.Hidden == true) {
      this.Hidden = false;
    } else {
      this.Hidden = true;
    }
  }
}
