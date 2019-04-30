'use strict';

function setControls() {
    var curMouse = { x: 0, y: 0 };
    $('canvas').bind('mousedown', function (event) {
        event.preventDefault();
        if (event.button === 0) {
            Game.dragstart(event.clientX, event.clientY);
        } else {
            Game.rotate(event.clientX, event.clientY);
        }
    });

    $('canvas').bind('mousemove', function (event) {
        curMouse.x = event.clientX;
        curMouse.y = event.clientY;
        Game.drag(event.clientX, event.clientY);
    });

    $('canvas').bind('mouseup', function (event) {
        if (event.button === 0) {
            event.preventDefault();
            Game.dragstop(event.clientX, event.clientY);
        }
    });

    $('canvas').bind('contextmenu', function (event) {
        return false;
    });

    if (!!('ontouchstart' in window)) {
        var obj = document.getElementById('world');
        var mouse = { x: 0, y: 0 };
        obj.addEventListener('touchstart', function (e) {
            e.preventDefault();
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            Game.dragstart(mouse.x, mouse.y);
        }, false);

        obj.addEventListener('touchend', function (e) {
            console.log(e);
            var diffX = Math.abs(mouse.x - e.changedTouches[0].clientX);
            var diffY = Math.abs(mouse.y - e.changedTouches[0].clientY);
            Game.dragstop(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            console.log(diffX, diffY);
            if (diffX < 30 && diffY < 30) {
                Game.rotate(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
        }, false);

        obj.addEventListener('touchmove', function (e) {
            Game.drag(e.touches[0].clientX, e.touches[0].clientY);
        }, false);
    }

    $('body').bind("keydown", function (e) {
        e.preventDefault();
        switch (e.keyCode) {

            case 37:
                //case 65: //left

                Game.rotateBack(curMouse.x, curMouse.y);
                break;

            case 39:
                //case 68: //right
                Game.rotate(curMouse.x, curMouse.y);
                break;
        }
    });
}
