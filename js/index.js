const teacher_group = document.getElementById('teacher');
const assistrant_group = document.getElementById('assistant');
const student_group = document.getElementById('student');

function listClickListener(e) {
    if (e.target && e.target.nodeName.toUpperCase() === 'LI') {
        console.log(e.target.id);
    }
}

function addChildByID(id, stream) {
    const item = document.getElementById(id);
    var li = document.createElement("li");
    li.id = stream;
    li.className = 'list-subitem';
    li.innerHTML = '<a href="javascript:;"><span>' + stream + '</span></a>';
    li.addEventListener('click', listClickListener);
    item.appendChild(li);
}

function delChildByID(parentid, id) {
    const parent = document.getElementById(parentid);
    const len = parent.childNodes.length;
    for (let i = 0; i < len; i++) {
        if (parent.childNodes[i].id == id) {
            parent.removeChild(parent.childNodes[i]);
            break;
        }
    }
}

addChildByID('teacher', '提利昂·兰尼斯特');
addChildByID('assistant', '二狗子');
addChildByID('assistant', '二丫');
addChildByID('student', 'Jim');
addChildByID('student', '狗蛋');
addChildByID('student', 'Catherine');
addChildByID('student', 'Allison');
addChildByID('student', 'Tom');
addChildByID('student', 'Lilei');
addChildByID('student', 'Han mei');
addChildByID('student', 'Lucy');
addChildByID('student', 'Lily');

function reSizeScroll() {
    console.log("窗口大小变了");
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
                console.log("修改了大小");
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