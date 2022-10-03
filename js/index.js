const pushButton = document.getElementById('btn_publish');
pushButton.addEventListener('click', e => PublishHandler('camera'));
const pushdocButton = document.getElementById('btn_screenshare');
pushdocButton.addEventListener('click', e => ScreenShareHandler('window'));

// const audio_input_devices = document.getElementById('audio_input_devices');
// const video_capture_devices = document.getElementById('video_capture_devices');
// const audio_output_devices = document.getElementById('audio_output_devices');

const groupvideo1 = document.getElementById('groupvideo1');
const groupvideo2 = document.getElementById('groupvideo2');
const groupvideo3 = document.getElementById('groupvideo3');
const groupvideo4 = document.getElementById('groupvideo4');
const groupvideo5 = document.getElementById('groupvideo5');
const remoteAudio = document.getElementById('remoteAudio');
groupvideo1.addEventListener('loadedmetadata', function() {
  console.log(`video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});
groupvideo1.addEventListener('resize', () => {
  console.log(`Remote video size changed to ${groupvideo1.videoWidth}x${groupvideo1.videoHeight}`);
});
groupvideo2.addEventListener('loadedmetadata', function() {
  console.log(`video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});
groupvideo2.addEventListener('resize', () => {
  console.log(`Remote video size changed to ${groupvideo2.videoWidth}x${groupvideo2.videoHeight}`);
});
groupvideo3.addEventListener('loadedmetadata', function() {
  console.log(`video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});
groupvideo3.addEventListener('resize', () => {
  console.log(`Remote video size changed to ${groupvideo3.videoWidth}x${groupvideo3.videoHeight}`);
});
groupvideo4.addEventListener('loadedmetadata', function() {
  console.log(`video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});
groupvideo4.addEventListener('resize', () => {
  console.log(`Remote video size changed to ${groupvideo4.videoWidth}x${groupvideo4.videoHeight}`);
});
groupvideo5.addEventListener('loadedmetadata', function() {
  console.log(`video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});
groupvideo5.addEventListener('resize', () => {
  console.log(`Remote video size changed to ${groupvideo5.videoWidth}x${groupvideo5.videoHeight}`);
});
let groupvideo = [groupvideo1,groupvideo2,groupvideo3,groupvideo4,groupvideo5];

const docVideo = document.getElementById('docVideo');
docVideo.addEventListener('loadedmetadata', function() {
  console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

let audio_input_device_id;
let audio_output_device_id;
let video_capture_device_id;

function getFreeVideoWindow() {
  for (let v of groupvideo) {
    if (v.srcObject==null) {
      return v;
    }
  }
  return null;
}

function listClickListener(e) {
    if (e.currentTarget && e.currentTarget.nodeName.toUpperCase() === 'LI') {
        let status = e.currentTarget.getAttribute('status');
        let userid = e.currentTarget.getAttribute('userid');
        let peerid = e.currentTarget.getAttribute('peerid');
        if (status==null) {
          return;
        }
        if(status=="false") {
          let videownd;
          if (peerid == 'window') {
            videownd = docVideo;
          } else {
            videownd = getFreeVideoWindow();
            if (videownd==null) {
              alert('没有空闲窗口！');
              return;
            }
          }
          subscribe_remote_stream(userid, peerid, videownd, remoteAudio);
          e.currentTarget.setAttribute('status', true);
        } else {
          e.currentTarget.setAttribute('status', false);
          unsubscribe_remote_stream(userid, peerid);
        }
    }
}

function addChildByID(id, info) {
    const item = document.getElementById(id);
    var li = document.createElement("li");
    li.id = info.userid+info.peerid;
    li.className = 'list-subitem';
    li.innerHTML = '<a href="javascript:;"><span>' + info.username + '</span></a>';
    li.addEventListener('click', listClickListener);
    li.setAttribute('userid', info.userid);
    li.setAttribute('peerid', info.peerid);
    li.setAttribute('status', false);
    item.appendChild(li);
}

function delChildByID(parentid, id) {
    const parent = document.getElementById(parentid);
    const len = parent.childNodes.length;
    for (let i = 0; i < len; i++) {
        let currentID = parent.childNodes[i].getAttribute('userid');
        if (currentID == id) {
            parent.removeChild(parent.childNodes[i]);
            break;
        }
    }
}

// addChildByID('teacher', 'Mr. Green');
// addChildByID('assistant', 'Juliano');
// addChildByID('student', 'Tom');
// addChildByID('student', 'Catherine');
// addChildByID('student', 'Allison');

function reSizeScroll() {
    var i, len;
    var element = document.getElementsByTagName("body");
    var child = element.firstChild;
    i = 0;
    len = element.length;
    while(i < len) {
        try {
            if(child.className === "slimScrollRail" ||
            child.className === "slimScrollBar" ||
            child.className === "slimScrollDiv") {
                child.parent().css("height", "auto");
                child.css("height", "auto");
                var h = child.parent().parent().height();
                child.parent().css("height", h);
                child.css("height", h);
            }
        } catch (error) {
            
        }
        
        child = child.nextSibling;
    }
}

$(function() {
    $('.lsm-scroll').slimscroll({
        height: 'auto',
        position: 'right',
        railOpacity: 1,
        disableFadeOut: true, //  自动隐藏滚动条
        railVisible: true, //  是否显示滚动条轨道
        touchScrollStep: 200, //  使用手势滚动量
        borderRadius: '7px', //滚动条圆角
        railBorderRadius: '7px', //轨道圆角
        size: "5px",
        //  color: '#fffafa', //滚动条颜色
        //  railColor: '#333', //轨道颜色
        opacity: .4, //滚动条透明度
        railOpacity: .2, //轨道透明度
        wheelStep: 5,
        touchScrollStep: 50
    });

    // lsm-sidebar收缩展开
    $('.lsm-sidebar a').on('click', function() {
        $('.lsm-scroll').slimscroll({
            height: 'auto',
            position: 'right',
            size: "8px",
            color: '#9ea5ab',
            wheelStep: 5,
            touchScrollStep: 50
        });
        
        $(this).parent("li").siblings("li.lsm-sidebar-item").children('ul').slideUp(200);
        if ($(this).next().css('display') == "none") {
            //展开未展开
            $(this).next('ul').slideDown(200);
            $(this).parent('li').addClass('lsm-sidebar-show').siblings('li').removeClass('lsm-sidebar-show');
        } else {
            //收缩已展开
            $(this).next('ul').slideUp(200);
            $(this).parent('li').removeClass('lsm-sidebar-show');
        }
        //  }
    });
});

function searchToggle(obj, evt) {
    var container = $(obj).closest('.search-wrapper');

    if (!container.hasClass('active')) {
        container.addClass('active');
        evt.preventDefault();
        alert('ddd');
        // } else if (container.hasClass('active') && $(obj).closest('.input-holder').length == 0) {
    } else if (container.hasClass('active')) {
        container.removeClass('active');
        // clear input
        container.find('.search-input').val('');
        // clear and hide result container when we press close
        container.find('.result-container').fadeOut(100, function() {
            $(this).empty();
        });
        alert('fff');
    }
}

function PublishHandler(peerid) {
    if (pushButton.innerText == 'Publish') {
        pushButton.innerText = 'Stop';
        let videownd = getFreeVideoWindow();
        publish_local_stream(peerid, videownd);
    } else if (pushButton.innerText == 'Stop') {
        pushButton.innerText = 'Publish';
        unpublish_local_stream(peerid);
    }
}

function ScreenShareHandler(peerid) {
    if (pushdocButton.innerText == 'Screen') {
        if (docVideo.srcObject!=null) {
          alert('已存在屏幕分享');
          return;
        }
        pushdocButton.innerText = 'Stop';
        publish_local_stream(peerid, docVideo);
    } else if (pushdocButton.innerText == 'Stop') {
        pushdocButton.innerText = 'Screen';
        unpublish_local_stream(peerid);
    }
}

set_user_event_callback(webrtc_event_monitor);
device_discovery();
const audio_input_map_ = new Map();
const video_input_map_ = new Map();
const audio_output_map_ = new Map();
let default_audio_input_groupid = '';
let default_audio_output_groupid = '';
async function webrtc_event_monitor(event) {
  if (event.id == 'device') {
    //console.log(event.info.deviceId+'    '+event.info.groupId+'    '+event.info.kind+'    '+event.info.label);
    const info = {
      devid: event.info.deviceId,
      groupid: event.info.groupId,
      devname: event.info.label
    };
    if (event.info.kind=='audioinput') {
      if (event.info.deviceId=='default' || event.info.deviceId=='communications') {
        if (default_audio_input_groupid=='') {
          default_audio_input_groupid = event.info.groupId;
        }
      } else {
        audio_input_map_.set(event.info.deviceId, info);
        var isSelect = (default_audio_input_groupid==event.info.groupId);
        if (isSelect) {
          audio_input_device_id = event.info.deviceId;
        }
        //audio_input_devices.add(new Option(event.info.label,event.info.deviceId,isSelect));
      }
    } else if (event.info.kind=='videoinput') {
      video_input_map_.set(event.info.deviceId, info);
      var isSelect = (event.info.label.search('Camera') != -1);
      if (isSelect) {
        video_capture_device_id = event.info.deviceId;
      }
      //video_capture_devices.add(new Option(event.info.label,event.info.deviceId));
    } else if (event.info.kind=='audiooutput') {
      if (event.info.deviceId=='default' || event.info.deviceId=='communications') {
        if (default_audio_output_groupid=='') {
          default_audio_output_groupid = event.info.groupId;
        }
      } else {
        audio_output_map_.set(event.info.deviceId, info);
        var isSelect = (default_audio_output_groupid==event.info.groupId);
        if (isSelect) {
          audio_output_device_id = event.info.deviceId;
        }
        //audio_output_devices.add(new Option(event.info.label,event.info.deviceId,isSelect));
      }
    }
  } else if (event.id == 'device-change') {
    default_audio_input_groupid = '';
    default_audio_output_groupid = '';
    audio_input_map_.clear();
    video_input_map_.clear();
    audio_output_map_.clear();
    device_discovery();
    console.log('device change');
  } else if (event.id == '') {

  } else if (event.id == '') {

  } else if (event.id == '') {

  } else if (event.id == '') {

  } else if (event.id == '') {

  }
}
