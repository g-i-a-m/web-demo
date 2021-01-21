'use strict';

const edit_nick = document.getElementById('editnick');
const edit_pwd = document.getElementById('editpwd');
const joinButton = document.getElementById('loginbtn');
joinButton.disabled = false;
joinButton.addEventListener('click', join);
let model = getQueryString('model');
if (typeof model == 'undefined' || model == null || model == '') {
  model = 'dev'; // default value is dev
}

function join() {
  if (model == 'invincible') {
    const token = 'eyJpdiI6IlhVd0xZNmU1WEFYQmk5VmQ3cStzRXc9PSIsInZhbHVlIjoiWmR0ckxiVk5aQnRUeCtwV2ZcL0Q1OEVqM3M4eDh2ZWtoRExQQTJxVEhObzJ2UG5wRTJ2TVpcL0dtV2EzZUF0NGdkR2twb1JOWmVWaHhwOCs4K1lJeU1tVzhuNmZna2lqdFE5ODFTMUJvSVVtOFNRcktQTVE2Z3VxcXVkN1Bud0NSeVFcL3FkNkczbUdING1vT0htVGN6TkVRPT0iLCJtYWMiOiJmODAyN2EzNmNjNWMzOTRiYmVkZTM1NTBhZmNkNWE1ZDU5MWZlYTFlYWFhY2U5ZmIzOTViNmNmNjBhOTkxZjhhIn0=';
    const roomid = '2019101810001';
    const mqtt_addr = '192.168.10.150';
    const mqtt_topic = '192.168.10.150';
    //  jump to room page
    window.localStorage.setItem('nickname', 'aaa');
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('roomid', roomid);
    window.localStorage.setItem('mqtt_addr', mqtt_addr);
    window.localStorage.setItem('mqtt_topic', mqtt_topic);
    window.location.href='index.html';
    return;
  }

  const nickname = edit_nick.value;
  const pwd = edit_pwd.value;
  if (nickname == '') {
    alert('请输入您的昵称');
  } else if (pwd == '') {
    alert('请输入口令');
  } else {
    getRoomInfo(nickname, pwd);
  }
}

async function getRoomInfo(nick, pwd) {
  const httpRequest = new XMLHttpRequest();
  if (httpRequest == null) {
    alert('你的浏览器不支持XMLHttp');
    return;
  }

  let url = 'http://dev-live.offcncloud.com/api/v1/users';
  let mqtt_addr = '192.168.10.150';
  let mqtt_topic = '192.168.10.150';
  if (model == 'test') {
    url = 'http://test-live.offcncloud.com/api/v1/users';
    mqtt_addr = 'test-mqq.offcncloud.com';
    mqtt_topic = '39.97.2.228';
  } else if (model == 'normal') {
    url = 'http://live.offcncloud.com/api/v1/users';
    mqtt_addr = 'mqq.offcncloud.com';
    mqtt_topic = '47.106.61.208';
  }

  httpRequest.open('POST', url);
  httpRequest.setRequestHeader('zgl-clienttype', 'OffcnLiveMC');
  httpRequest.setRequestHeader('zgl-systemtype', 'linux');
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  const array={
    password: pwd,
    nickname: nick
  };
  const body=JSON.stringify(array);
  httpRequest.send(body);

  httpRequest.onreadystatechange = (e) =>{
    const json = JSON.parse(httpRequest.responseText);
    if (json.code == 200) {
      if (json.data.room_type!=1) {
        alert('非小班课口令!');
        return;
      }

      //  jump to room page
      window.localStorage.setItem('token', json.data.access_token);
      window.localStorage.setItem('roomid', json.data.room_id);
      window.localStorage.setItem('mqtt_addr', mqtt_addr);
      window.localStorage.setItem('mqtt_topic', mqtt_topic);
      window.location.href='index.html';
    }
  };
}

function getQueryString(key) {
  const reg = new RegExp('(^|&)' + key + '=([^&]*)(&|$)', 'i');
  const r = window.location.search.substr(1).match(reg);
  if (r != null) {
    return unescape(r[2]);
  };
  return '';
}

// 粒子背景特效
// $('body').particleground({
//   dotColor: '#E8DFE8',
//   lineColor: '#133b88'
// });
// $('input[name="pwd"]').focus(function() {
//   $(this).attr('type', 'password');
// });
// $('input[type="text"]').focus(function() {
//   $(this).prev().animate({
//     'opacity': '1'
//   }, 200);
// });
// $('input[type="text"],input[type="password"]').blur(function() {
//   $(this).prev().animate({
//     'opacity': '.5'
//   }, 200);
// });
// $('input[name="login"],input[name="pwd"]').keyup(function() {
//   const Len = $(this).val().length;
//   if (!$(this).val() == '' && Len >= 5) {
//     $(this).next().animate({
//       'opacity': '1',
//       'right': '30'
//     }, 200);
//   } else {
//     $(this).next().animate({
//       'opacity': '0',
//       'right': '20'
//     }, 200);
//   }
// });

// 全屏
// eslint-disable-next-line no-unused-vars
const fullscreen = function() {
  elem = document.body;
  if (elem.webkitRequestFullScreen) {
    elem.webkitRequestFullScreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.requestFullScreen) {
    elem.requestFullscreen();
  } else {
    // 浏览器不支持全屏API或已被禁用
  }
};
